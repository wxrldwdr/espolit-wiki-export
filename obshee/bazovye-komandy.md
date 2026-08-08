---
layout:
  width: default
  title:
    visible: true
  description:
    visible: false
  tableOfContents:
    visible: true
  outline:
    visible: true
  pagination:
    visible: true
  metadata:
    visible: false
  tags:
    visible: true
  actions:
    visible: true
---

# Базовые команды

### Информация об игроках

<details>

<summary><mark style="color:$primary;">Ваш профиль</mark></summary>

Введите <mark style="color:$primary;">/p</mark> чтобы посмотреть информацию о себе\\

В чате откроется профиль с информацией и меню быстрого доступа, где можно найти:

* Город и нацию, в которых вы состоите
* [<mark style="color:$primary;">Екойны</mark>](../goroda/gorodskie-komandy/drugie-mekhaniki.md#ekoiny)
* Дата первой регистрации
* [<mark style="color:$primary;">Список друзей</mark>](bazovye-komandy.md#list-druzei-i-vzaimodeistviya)

<figure><img src="../.gitbook/assets/image (130).png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;">Профиль другого игрока</mark></summary>

Введите <mark style="color:$primary;">/p <Ник игрока></mark> чтобы посмотреть информацию о другом игроке

В чате откроется профиль с информацией и меню быстрого доступа, где можно найти:

* Город и нацию, в которых состоит игрок
* Дата первой регистрации
* Дата последнего входа
* Статус Онлайн или Оффлайн
* Добавить в друзья
* Написать сообщение

<figure><img src="../.gitbook/assets/image (129).png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
Информацию об игроке можно посмотреть так же, кликнув по игроку <mark style="color:$primary;">Shift+ПКМ</mark>
{% endhint %}

</details>

### Друзья

<details>

<summary><mark style="color:$primary;">Как добавить друга?</mark></summary>

Чтобы добавить друга, пропиши <mark style="color:$primary;">/p friend add <Ник игрока></mark>

После чего, другому игроку придёт запрос, который может принять/отклонить

<figure><img src="../.gitbook/assets/image (198).png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
Игроки в друзьях имеют доступ к Вашим личным территориям
{% endhint %}

</details>

<details>

<summary><mark style="color:$primary;">Как удалить друга?</mark></summary>

Чтобы удалить друга, пропиши команду <mark style="color:$primary;">/p friend remove</mark>

Подтверждать со стороны ничего не надо, данный игрок потеряет доступ к Вашим территориям

</details>

<details>

<summary><mark style="color:$primary;">Лист друзей и взаимодействия</mark></summary>

По команде <mark style="color:$primary;">/p friend list</mark> (или через меню <mark style="color:$primary;">/p</mark>) откроется меню друзей

<figure><img src="../.gitbook/assets/image (134).png" alt=""><figcaption></figcaption></figure>

В нём можно взаимодействовать с друзьями и видеть основную информацию о них

Кликнув на одного из них, можно:

* Написать сообщение
* Показать местоположение игрока
* Удалить из друзей

<figure><img src="../.gitbook/assets/image (135).png" alt=""><figcaption></figcaption></figure>



</details>

### Личные сообщения

|                                                                    |                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| <mark style="color:$primary;">/msg <Ник игрока> <сообщение></mark> | Написать личное сообщение                           |
| <mark style="color:$primary;">/reply <сообщение></mark>            | Ответить на последнее сообщение                     |
| <mark style="color:$primary;">/ignore <Ник игрока></mark>          | Не принимать личные сообщения от указанного игрока  |
| <mark style="color:$primary;">/ignorelist</mark>                   | Вывести список игроков, которые не могут Вам писать |

### Чаты

<details>

<summary><mark style="color:$primary;">Глобальный чат</mark></summary>

В глобальном чате все слышат всех на неограниченном расстоянии. Чтобы писать в него, достаточно прописать команду <mark style="color:$primary;">/g</mark>.

{% hint style="danger" %}
Помните, что, администраторы следят за чатами, а особенно за глобальным, поэтому огромная просьба не нарушать правила сервера
{% endhint %}

{% hint style="warning" %}
При первом заходе на сервер глобальный чат облагается задержкой (45 сек) до первого входа в город
{% endhint %}

</details>

<details>

<summary><mark style="color:$primary;">Локальный чат</mark></summary>

Чтобы переключить канал сообщений на Локальный, нужно прописать команду <mark style="color:$primary;">/l</mark>

Игроки видят сообщения локального чата только на расстоянии 50 блоков.

</details>

<details>

<summary><mark style="color:$primary;">Городской чат</mark></summary>

Чтобы переключить канал сообщений на Городской, нужно прописать команду <mark style="color:$primary;">/tc</mark>

Городской чат не ограничен по расстоянию, но видеть Ваши сообщения могут только жители Вашего города

</details>

<details>

<summary><mark style="color:$primary;">Национальный чат</mark></summary>

Чтобы переключить канал сообщений на Национальный, нужно прописать команду <mark style="color:$primary;">/nc</mark>

Национальный чат так же не ограничен по расстоянию, и видеть Ваши сообщения могут все жители Вашего города, и жители городов, расположенных в одной нации

</details>

### Упоминания

<details>

<summary><mark style="color:$primary;">Как упомянуть ник игрока в чате?</mark></summary>

Чтобы упомянуть игрока в чате, достаточно просто прописать в сообщении <mark style="color:$primary;">@Ник\_Игрока</mark>

<figure><img src="../.gitbook/assets/image (225).png" alt=""><figcaption></figcaption></figure>

Игрок получит уведомление со звуком, а так же его никнейм будет выделен среди сообщения



</details>

<details>

<summary><mark style="color:$primary;">Отключить упоминания</mark></summary>

Чтобы включить или отключить упоминания, пропишите команду <mark style="color:$primary;">/ic mentiontoggle</mark>

И тогда игроки даже если будут пытаться Вас упомянуть, уведомление Вам не придёт

</details>

### Прочее

|                                              |                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <mark style="color:$primary;">/co i</mark>   | Информация о конкретном блоке и взаимодействиях с ним других игроков                                                                                                                       |
| <mark style="color:$primary;">/helpop</mark> | <p>Написать сообщение администрации сервера<br><a href="../glavnaya/pomosh-po-igre.md#podderzhka-vnutri-igry"><mark style="color:$primary;">Нажмите, чтобы узнать подробнее</mark></a></p> |
| <mark style="color:$primary;">/prefix</mark> | <p>Добавляет префикс в TAB и некоторые каналы чата<br><a href="drugie-vozmozhnosti/#prefiksy"><mark style="color:$primary;">Нажмите чтобы узнать подробнее</mark></a></p>                  |

***

## Телепорт

### Общие команды

<table data-full-width="false"><thead><tr><th width="377"></th><th></th></tr></thead><tbody><tr><td><mark style="color:$primary;">/spawn</mark></td><td>Телепортироваться на центральный спавн</td></tr><tr><td><mark style="color:$primary;">/lobby</mark></td><td>Телепортироваться в лобби</td></tr><tr><td><mark style="color:$primary;">/tpa &#x3C;Ник игрока></mark></td><td>Отправить запрос на телепорт к нему</td></tr><tr><td><mark style="color:$primary;">/tpa accept / deny</mark></td><td>Принять/отклонить запрос</td></tr><tr><td><mark style="color:$primary;">/tpahere &#x3C;Ник игрока></mark></td><td>Отправить запрос на телепорт к себе</td></tr></tbody></table>

### Телепортироваться к игроку

<details>

<summary><mark style="color:$primary;">Как телепортироваться к игроку?</mark></summary>

Чтобы телепортироваться к игроку, пропишите одну из двух команд

* <mark style="color:$primary;">/tpa <Ник игрока></mark> - Чтобы телепортироваться к игроку
* <mark style="color:$primary;">/tpahere <Ник игрока></mark> - Чтобы телепортировать Вас к игроку

После ввода, игрок получит сообщение в чате с запросом о телепортации, которое он сможет как принять, так и отклонить

{% hint style="info" %}
Некоторые игроки могут использовать запросы для собственной выгоды, чтобы убить Вас или заманить в ловушку!
{% endhint %}

</details>

|                                                            |                                     |
| ---------------------------------------------------------- | ----------------------------------- |
| <mark style="color:$primary;">/tpa <Ник игрока></mark>     | Отправить запрос на телепорт к нему |
| <mark style="color:$primary;">/tpahere <Ник игрока></mark> | Отправить запрос на телепорт к себе |

***

## Статистика

<table data-full-width="false"><thead><tr><th width="377"></th><th></th></tr></thead><tbody><tr><td><mark style="color:$primary;">/mspt</mark></td><td>Посмотреть текущий MSPT сервера</td></tr><tr><td><mark style="color:$primary;">/tps</mark></td><td>Посмотреть текущий TPS сервера</td></tr><tr><td><mark style="color:$primary;">/ping</mark></td><td>Посмотреть текущий пинг</td></tr><tr><td><mark style="color:$primary;">/playtime</mark></td><td>Посмотреть количество наигранного времени на сервере</td></tr><tr><td><mark style="color:$primary;">/playtimetop</mark></td><td>Топ игроков по наигранному времени на сервере</td></tr><tr><td><mark style="color:$primary;">/sb</mark></td><td>Открывает панель со статистикой и основной информации</td></tr></tbody></table>

***

## Смена скина

{% include "../.gitbook/includes/untitled.md" %}

<details>

<summary><mark style="color:$primary;">Загрузка собственного скина</mark></summary>

Чтобы загрузить свой скин, для начала, потребуется его создать, или скачать уже существующий.

* Создать скин можно на таких сайтах как: [<mark style="color:$primary;">https://minecraft.novaskin.me/</mark>](https://minecraft.novaskin.me/)



1. После того, как нарисовать скин, находясь на сервере нужно прописать команду <mark style="color:$primary;">/skin upload</mark>.&#x20;

<figure><img src="../.gitbook/assets/image (211).png" alt=""><figcaption></figcaption></figure>

2. После, переходим по ссылке что нам дала команда и появляемся на сайте

<figure><img src="../.gitbook/assets/image (212).png" alt=""><figcaption></figcaption></figure>

3. Загружаем скачанный или нарисованный скин в поле <mark style="color:$primary;">"Drag and drop skin file here"</mark>
4. Нажимаем <mark style="color:$primary;">"Generate /skin url"</mark>

<figure><img src="../.gitbook/assets/image (214).png" alt=""><figcaption></figcaption></figure>

5. Прописываем команду с ссылкой, что мы скопировали на сайте и скин применится на персонажа!

<figure><img src="../.gitbook/assets/image (215).png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;">Редактор скинов</mark></summary>

1. Чтобы открыть редактор скинов, пропишите команду <mark style="color:$primary;">/skin edit</mark>

<figure><img src="../.gitbook/assets/image (216).png" alt=""><figcaption></figcaption></figure>

2. При переходе по ссылке вы попадаете в редактор скинов, где можете создать или отредактировать текущий скин

<figure><img src="../.gitbook/assets/image (217).png" alt=""><figcaption></figcaption></figure>

3. Сохраняем скин, а потом загружаем скин по <mark style="color:$primary;">/skin upload</mark>

</details>

***

## Вставка своих картинок

<details>

<summary><mark style="color:$primary;">Как загрузить собственную картинку на сервер?</mark></summary>

#### Способ #1

1. Вставь рамки на блоки, куда нужно разместить изображение
2. Пропиши команду <mark style="color:$primary;">/if select</mark> для выбора рамок, куда нужно вставить картинку
3. Пропиши <mark style="color:$primary;">/imageframe create <название> \<ccылка> selection</mark>, чтобы изображение сразу встало на выбранные рамки

#### Способ #2

1. Вставь рамки на блоки, куда нужно разместить изображение
2. Пропиши команду <mark style="color:$primary;">/imageframe create <название> \<ccылка> <ширина> <высота> combined</mark>
3. Полученное изображение будет в инвентаре. Чтобы его активировать, надо взять его в руки, и кликнуть им по рамке

</details>

{% hint style="info" %}
Картинки могут пропасть/не загружаться, если на основном сервере они удалены. В качестве удобного загрузчика можете использовать обычные сообщения из Discord

Если Вы уверены, что изображение всё ещё находится на сервере, пропишите команду <mark style="color:$primary;">/if refresh <Имя></mark>
{% endhint %}

|                                                                                                         |                                                                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| <mark style="color:$primary;">/if select</mark>                                                         | Выбрать рамки, куда нужно разместить изображение                   |
| <mark style="color:$primary;">/imageframe create <название> \<ccылка> selection</mark>                  | Загружает изображение по ссылке в выбранные рамки                  |
| <mark style="color:$primary;">/imageframe create <название> \<ccылка> <ширина> <высота> combined</mark> | Загружает изображение по ссылке в инвентарь                        |
| <mark style="color:$primary;">/if clone <Имя> <Новое имя> selection</mark>                              | Клонирует изображение в выбранные рамки /if selection              |
| <mark style="color:$primary;">/if clone <Имя> <Новое имя> combined</mark>                               | Клонирует изображение в инвентарь                                  |
| <mark style="color:$primary;">/if refresh <Имя> <Новая ссылка></mark>                                   | Обновить ссылку на изображении                                     |
| <mark style="color:$primary;">/if refresh <Имя></mark>                                                  | Обновить картинки с указанным именем                               |
| <mark style="color:$primary;">/if get <Имя> selection</mark>                                            | Загружает существующее изображение в выбранные рамки /if selection |
| <mark style="color:$primary;">/if get <Имя> combined</mark>                                             | Загружает существующее изображение в инвентарь                     |
| <mark style="color:$primary;">/if list</mark>                                                           | Список загруженных изображений                                     |
| <mark style="color:$primary;">/if rename <Имя ><Новое имя></mark>                                       | Переименовать изображение                                          |
| <mark style="color:$primary;">/if delete <Имя></mark>                                                   | Удалить изображение                                                |
