const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

// Supabase на бесплатном тарифе не принимает файл больше 50 МБ, а с телефона
// минутный ролик легко весит вдвое больше. Поэтому тяжёлое видео пережимаем
// сами: принять и молча отказать — худший из вариантов.

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

// Ступени сжатия: сначала бережная, дальше жёстче. Останавливаемся на первой,
// которая уложилась в лимит, чтобы не портить картинку сильнее необходимого.
const PRESETS = [
  { width: 1280, crf: 30, audio: '128k', label: '720p' },
  { width: 854, crf: 32, audio: '96k', label: '480p' },
  { width: 640, crf: 34, audio: '64k', label: '360p' },
];

// Pi 4 пережимает медленно, но бесконечно ждать нельзя: зависший ffmpeg
// удержал бы запрос навсегда.
const TIMEOUT_MS = 20 * 60 * 1000;

let availability = null;

function run(args, { timeout = TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      // Держим только хвост: полный лог ffmpeg — это мегабайты прогресса.
      stderr = (stderr + chunk.toString()).slice(-4000);
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Сжатие видео заняло слишком много времени'));
    }, timeout);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg завершился с кодом ${code}: ${stderr.slice(-500)}`));
    });
  });
}

// Проверяем один раз за жизнь процесса: наличие ffmpeg по ходу не меняется.
async function isAvailable() {
  if (availability !== null) return availability;

  try {
    await run(['-version'], { timeout: 10000 });
    availability = true;
  } catch {
    availability = false;
    console.warn(
      '[media] ffmpeg не найден: тяжёлое видео будет отклоняться вместо сжатия. ' +
        'Установите его командой sudo apt install -y ffmpeg'
    );
  }

  return availability;
}

function tempFile(extension) {
  return path.join(os.tmpdir(), `ns-${Date.now()}-${crypto.randomUUID()}${extension}`);
}

async function sizeOf(file) {
  const stat = await fs.stat(file);
  return stat.size;
}

async function remove(file) {
  if (!file) return;
  await fs.unlink(file).catch(() => {});
}

// Возвращает путь к пережатому файлу или null, если уложиться не удалось.
async function compressVideo(inputPath, targetBytes) {
  if (!(await isAvailable())) return null;

  for (const preset of PRESETS) {
    const output = tempFile('.mp4');

    try {
      await run([
        '-y',
        '-i',
        inputPath,
        // Не растягиваем: min(ширина, iw) оставляет узкое видео как есть.
        // -2 подбирает высоту кратной двум — h264 иначе не кодирует.
        '-vf',
        `scale=min(${preset.width}\\,iw):-2`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        String(preset.crf),
        '-c:a',
        'aac',
        '-b:a',
        preset.audio,
        // Индекс в начало файла: без этого браузер не начнёт проигрывать,
        // пока не скачает ролик целиком.
        '-movflags',
        '+faststart',
        output,
      ]);
    } catch (err) {
      await remove(output);
      console.error(`[media] сжатие в ${preset.label} не удалось: ${err.message}`);
      continue;
    }

    const size = await sizeOf(output);
    if (size <= targetBytes) {
      console.log(`[media] видео пережато в ${preset.label}, размер ${Math.round(size / 1048576)} МБ`);
      return { path: output, label: preset.label, size };
    }

    await remove(output);
  }

  return null;
}

// Звук пережимается одним проходом: у аудио нет разрешения, крутить нечего.
async function compressAudio(inputPath, targetBytes) {
  if (!(await isAvailable())) return null;

  const output = tempFile('.mp3');

  try {
    await run(['-y', '-i', inputPath, '-c:a', 'libmp3lame', '-b:a', '96k', output]);
  } catch (err) {
    await remove(output);
    console.error(`[media] сжатие звука не удалось: ${err.message}`);
    return null;
  }

  const size = await sizeOf(output);
  if (size <= targetBytes) {
    console.log(`[media] звук пережат, размер ${Math.round(size / 1048576)} МБ`);
    return { path: output, label: '96 кбит/с', size };
  }

  await remove(output);
  return null;
}

module.exports = { compressAudio, compressVideo, isAvailable, remove };
