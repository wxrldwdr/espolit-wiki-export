SURWAVE WIKI — перенесённый контент ESPOLIT в стилистике Surwave

ЗАПУСК
1. Установи Python 3, если его нет.
2. Запусти START_SURWAVE_WIKI.bat в корне архива или surwave-site\START_WIKI.bat.
3. Откроется готовая Surwave Wiki. Ничего собирать перед запуском не нужно.

ГДЕ НАХОДЯТСЯ ПЕРЕНЕСЁННЫЕ СТРАНИЦЫ
surwave-site/content/

Туда скопированы страницы ESPOLIT, которые теперь используются новой Surwave Wiki как собственный редактируемый контент. Структура разделов сохранена.

ГОТОВЫЕ СТРАНИЦЫ САЙТА
surwave-site/wiki/

Для каждого раздела создана отдельная HTML-страница. Контент загружается только из surwave-site/content/, а не из исходных ESPOLIT Markdown в корне.

КАРТИНКИ И МЕДИА
Все исходные изображения GitBook остаются локально в .gitbook/assets/ и используются страницами Surwave напрямую, без внешних hotlink и без повторного сжатия. Поэтому скриншоты сохраняются в исходном качестве и уже входят в полный архив репозитория.

ЧТО РЕДАКТИРОВАТЬ
- Тексты новой Wiki: surwave-site/content/
- Навигация: surwave-site/assets/js/site-data.json
- Стили: surwave-site/assets/css/site.css
- Отображение Markdown/GitBook-блоков: surwave-site/assets/js/migrated-wiki.js
- Логотип: surwave-site/assets/logos/surwave-wiki-logo.svg

ПОДДЕРЖАНО ИЗ ESPOLIT/GITBOOK
- заголовки и якоря;
- внутренние и внешние ссылки;
- PNG/JPEG/GIF/APNG из .gitbook/assets;
- figure/figcaption;
- details;
- hint;
- stepper/step;
- embed;
- content-ref;
- таблицы;
- списки;
- цитаты;
- inline code;
- выделения mark.

СТИЛЬ SURWAVE
Основные акценты: #00ff78 и #00ffc0, тёмный интерфейс, центрированный прямоугольный логотип, постоянная активная кнопка «Добро пожаловать», плавные раскрывающиеся разделы и правое содержание страницы.

ПРИМЕЧАНИЕ ПО СОДЕРЖИМОМУ
Тексты были перенесены из ESPOLIT как база для Surwave. Название ESPOLIT при отображении автоматически заменяется на Surwave. Серверные ссылки, адреса, конкретные цифры и механики, которые отличаются между проектами, лучше проверять и править непосредственно в surwave-site/content/.