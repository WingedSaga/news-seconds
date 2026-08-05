import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ImagePlus, Send, X } from 'lucide-react';
import api from '../api/axios';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = [
  { value: 'news', label: 'Новости' },
  { value: 'joke', label: 'Анекдоты' },
  { value: 'weather', label: 'Погода' },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function Submit() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', content: '', category: 'news' });
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
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
    if (content.length < 20) errors.content = 'Текст должен быть не короче 20 символов';
    if (content.length > 20000) errors.content = 'Текст не должен превышать 20000 символов';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Можно загрузить только изображение');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Размер изображения не должен превышать 5 МБ');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.url);
      setImagePreview(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
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
        image_url: imageUrl || undefined,
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
          <span className="text-sm font-semibold text-neutral-700">Изображение</span>

          {imagePreview ? (
            <div className="relative w-fit">
              <img src={imagePreview} alt="Предпросмотр" className="h-40 rounded-md border border-neutral-200 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setImagePreview('');
                }}
                className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-neutral-500 shadow hover:text-red-600"
                aria-label="Удалить изображение"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label className="btn-outline w-fit cursor-pointer">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {uploading ? 'Загружаем...' : 'Выбрать файл'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
          <p className="text-xs text-neutral-400">JPG, PNG, WEBP или GIF, до 5 МБ. Поле необязательное.</p>
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting || uploading}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Отправляем...' : 'Отправить на модерацию'}
        </button>
      </form>
    </div>
  );
}
