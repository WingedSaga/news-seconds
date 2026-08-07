/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2E7D32',
          hover: '#43A047',
          accent: '#A5D6A7',
          dark: '#1B5E20',
        },
        surface: '#F5F5F5',
        // Тёплая бумага вместо стерильно-серого фона: газета не бывает
        // цвета интерфейса, и это главное, что задаёт ощущение печати.
        paper: '#FBFAF7',
        ink: '#1A1A1A',
      },
      fontFamily: {
        // Оба шрифта лежат в репозитории (src/fonts) и покрывают кириллицу.
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Заголовки набираются шрифтом с засечками — это и даёт газетный вид.
        // Имя в кавычках: без них цифра в «Source Serif 4» делает запись
        // невалидной и браузер молча выбрасывает шрифт.
        serif: ['"Source Serif 4"', 'Georgia', 'PT Serif', 'serif'],
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
