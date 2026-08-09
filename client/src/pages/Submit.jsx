import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileAudio, FileVideo, ImagePlus, Paperclip, Send, X } from 'lucide-react';
import api from '../api/axios';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = [
  { value: 'news', label: 'Новости' },
  { value: 'joke', label: 'Анекдоты' },
  { value: 'weather', label: 'Погода' },
  { value: 'other', label: 'Другое' },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const MEDIA_TYPES = ['audio/mpeg', 'audio/mp3', 'video/mp4'];

export default function Submit() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', content: '', category: 'news' });
  const [images, setImages] = useState([]);
  const [media, setMedia] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const title = form.title.trim();
    const content = form.content.trim();

    if (title.length < 5 || title.length > 200) errors.title = 'Заголовок должен быть от 5 до 200 символов';
    if (content.length === 0) errors.content = 'Напишите текст новости';
    if (content.length > 20000) errors.content = 'Текст не должен превышать 20000 символов';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = async (event) => {
    const chosen = Array.from(event.target.files || []);
    if (chosen.length === 0) return;

    setError('');

    const free = MAX_IMAGES - images.length;
    if (free <= 0) {
      setError(`Больше ${MAX_IMAGES} изображений добавить нельзя`);
      event.target.value = '';
      return;
    }

    // Лишние файлы отбрасываем, но остальные всё равно загружаем.
    const accepted = chosen.slice(0, free);
    if (chosen.length > free) {
      setError(`Добавлены первые ${free}: всего можно не больше ${MAX_IMAGES} изображений`);
    }

    setUploading(true);
    try {
      for (const file of accepted) {
        if (!file.type.startsWith('image/')) {
          setError('Можно загружать только изображения');
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setError(`Файл «${file.name}» больше 5 МБ`);
          continue;
        }

        const formData = new FormData();
        formData.append('image', file);

        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImages((prev) => [...prev, { url: data.url, name: file.name }]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (url) => setImages((prev) => prev.filter((image) => image.url !== url));

  const handleMediaChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    // Браузеры иногда отдают пустой тип для mp3, поэтому проверяем и расширение.
    const looksAllowed = MEDIA_TYPES.includes(file.type) || /\.(mp3|mp4)$/i.test(file.name);
    if (!looksAllowed) {
      setError('Прикрепить можно только MP3 или MP4');
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setError('Размер файла не должен превышать 50 МБ');
      return;
    }

    const formData = new FormData();
    formData.append('media', file);

    setUploadingMedia(true);
    try {
      const { data } = await api.post('/upload/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMedia({ url: data.url, type: data.media_type, name: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.post('/articles', {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        image_urls: images.map((image) => image.url),
        media_url: media?.url || undefined,
        media_type: media?.type || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/my-articles'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-brand" aria-hidden="true" />
          <h1 className="text-xl font-extrabold text-neutral-900">Новость отправлена на модерацию</h1>
          <p className="text-sm text-neutral-500">
            Редакция проверит материал. Статус можно отслеживать в разделе «Мои новости».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Предложить новость</h1>
        <p className="text-sm text-neutral-500">
          Материал появится на сайте после проверки редакцией.
        </p>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-6" noValidate>
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-semibold text-neutral-700">
            Заголовок
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={update('title')}
            maxLength={200}
            className="field"
            placeholder="О чём новость?"
          />
          {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-semibold text-neutral-700">
            Категория
          </label>
          <select id="category" value={form.category} onChange={update('category')} className="field">
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="text-sm font-semibold text-neutral-700">
            Текст
          </label>
          <textarea
            id="content"
            rows={10}
            value={form.content}
            onChange={update('content')}
            maxLength={20000}
            className="field resize-y"
            placeholder="Расскажите подробности..."
          />
          <div className="flex items-center justify-between">
            {fieldErrors.content ? (
              <p className="text-xs text-red-600">{fieldErrors.content}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-neutral-400">{form.content.length} / 20000</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-neutral-700">
            Изображения ({images.length} из {MAX_IMAGES})
          </span>

          {images.length > 0 && (
            <ul className="flex flex-wrap gap-3">
              {images.map((image, index) => (
                <li key={image.url} className="relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-24 w-32 rounded-md border border-neutral-200 object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Обложка
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.url)}
                    className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-neutral-500 shadow hover:text-red-600"
                    aria-label={`Удалить ${image.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {images.length < MAX_IMAGES && (
            <label className="btn-outline w-fit cursor-pointer">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {uploading ? 'Загружаем...' : images.length === 0 ? 'Выбрать файлы' : 'Добавить ещё'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}

          <p className="text-xs text-neutral-400">
            JPG, PNG, WEBP или GIF, до 5 МБ каждое, не больше {MAX_IMAGES} штук.
            Первое изображение станет обложкой в ленте. Поле необязательное.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-neutral-700">Аудио или видео</span>

          {media ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                {media.type === 'video' ? (
                  <FileVideo className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                ) : (
                  <FileAudio className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{media.name}</span>
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Убрать вложение"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {media.type === 'video' ? (
                <video src={media.url} controls className="w-full rounded-md border border-neutral-200" />
              ) : (
                <audio src={media.url} controls className="w-full" />
              )}
            </div>
          ) : (
            <label className="btn-outline w-fit cursor-pointer">
              <Paperclip className="h-4 w-4" aria-hidden="true" />
              {uploadingMedia ? 'Загружаем...' : 'Прикрепить файл'}
              <input
                type="file"
                accept="audio/mpeg,video/mp4,.mp3,.mp4"
                onChange={handleMediaChange}
                disabled={uploadingMedia}
                className="hidden"
              />
            </label>
          )}
          <p className="text-xs text-neutral-400">
            MP3 или MP4, до 50 МБ. Загрузка большого файла занимает время — дождитесь окончания.
          </p>
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting || uploading || uploadingMedia}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Отправляем...' : 'Отправить на модерацию'}
        </button>
      </form>
    </div>
  );
}
