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
<!--SURWAVE_GRADIENTS:%7B%22version%22%3A3%2C%22blocks%22%3A%7B%7D%7D-->
<!--SURWAVE_LAYOUT:%7B%2214%22%3A%7B%22layout%22%3A%7B%22width%22%3A%22%22%2C%22widthUnit%22%3A%22px%22%2C%22height%22%3A%22%22%2C%22align%22%3A%22default%22%7D%2C%22color%22%3A%22%2300ff77%22%7D%7D-->
<div data-sw-editor-style="1" style="display:none"><style>.sw-sized{box-sizing:border-box;max-width:100%}.sw-image-frame>figure{display:flex;flex-direction:column;height:100%;margin:0!important;overflow:hidden}.sw-image-frame>figure>.wiki-image{flex:1;min-height:0;width:100%!important;height:100%;object-fit:var(--sw-image-fit,contain);transform:scale(var(--sw-image-scale,1));transform-origin:center center;transition:transform .18s ease}.sw-image-frame>figure>figcaption{flex:none}.sw-hint-color>.hint{border-color:color-mix(in srgb,var(--sw-hint-color) 55%,#213036)!important;border-left:4px solid var(--sw-hint-color)!important;background:color-mix(in srgb,var(--sw-hint-color) 8%,#091013)!important}</style></div>
# Базовые команды

## Информация об игроках

<details>

<summary><mark style="color:$primary;">Ваш паспорт</mark></summary>

<p><mark style="color:rgb(5, 255, 122);"></mark><mark style="color:rgb(0, 199, 93);"></mark><mark style="color:rgb(0, 255, 119);"></mark><mark style="color:rgb(0, 0, 0);"></mark>Введите [<mark style="color:rgb(0, 255, 119);">/pass</mark>](#copy) чтобы посмотреть свою статистику<br>С помощью команды[<mark style="color:rgb(0, 255, 119);"> /pass show</mark>](#copy) вы можете открыть свой паспорт для просмотра другим игрокам</p>

<figure><img src=".gitbook/assets/Снимок экрана 2026-08-12 211218.png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;">Паспорт другого игрока</mark></summary>

<p><mark style="color:rgb(0, 255, 119);"></mark>Если другой игрок прописал команду [<mark style="color:rgb(0, 255, 119);">/pass show</mark>](#copy), то вы сможете посмотреть его паспорт нажав по игроку на <mark style="color:rgb(0, 255, 119);">Shift+ПКМ</mark>.<br>Так же, игрок сам может показать свой паспорт по команду <mark style="color:rgb(0, 255, 119);">/pass show <Ваш никнейм></mark><br><mark style="color:rgb(0, 255, 119);"><br></mark></p>

<p></p>

</details>

## Друзья

<details>

<summary><mark style="color:$primary;">Как добавить друга?</mark></summary>

<p>Чтобы добавить друга, пропиши <mark style="color:$primary;">/friend add <Ник игрока></mark></p>

<p>После чего, другому игроку придёт запрос, который может принять/отклонить<br><br><br></p>

<p></p>

</details>

<details>

<summary><mark style="color:$primary;">Как удалить друга?</mark></summary>

<p>Чтобы удалить друга, пропиши команду <mark style="color:$primary;">/friend remove <Ник игрока></mark></p>

<p>Подтверждать со стороны ничего не надо, данный игрок потеряет доступ к Вашим территориям</p>

</details>

## Чаты

<details>

<summary><mark style="color:$primary;">Локальный чат</mark></summary>

<p>Чтобы переключить канал сообщений на Локальный, нужно прописать команду <mark style="color:$primary;">/l</mark></p>

<p>Игроки видят сообщения локального чата только на расстоянии 30 блоков.</p>

</details>

<details>

<summary><mark style="color:$primary;">Глобальный чат</mark></summary>

<p>В глобальном чате все слышат всех на неограниченном расстоянии. Чтобы писать в него, достаточно прописать команду <mark style="color:$primary;">/g</mark>.</p>

{% hint style="danger" %}
<p>Помните, что, администраторы следят за чатами, а особенно за глобальным, поэтому огромная просьба не нарушать правила сервера</p>
{% endhint %}

</details>

### Личные сообщения

| Команда | Что означает |
| --- | --- |
| /msg <Ник игрока> <сообщение> | Написать личное сообщение |
| /reply <сообщение> | Ответить на последнее сообщение |
| /msg mute <Ник игрока> | Не принимать личные сообщения от указанного игрока |
| /msg unmute <Ник игрока> | Снова принимать личные сообщения игрока |

### Заглушение чатов и игроков

| Команда | Что означает |
| --- | --- |
| /chat mute <Игрок> <Где заглушить> | Заглушить определённого игрока везде или в определённом канале |
| /chat unmute <Игрок> <Где разглушить> | Снова видеть сообщения определённого игрока везде или в определённом канале |

<div class="sw-sized sw-hint-color" data-sw-path="14" style="box-sizing:border-box;max-width:100%;--sw-hint-color:#00ff77">
{% hint style="info" %}
<p><mark style="color:rgb(255, 255, 255);">Доступные значения где можно заглушить игрока:</mark><br><mark style="color:rgb(255, 255, 255);">- global</mark> <mark style="color:rgb(158, 158, 158);">- в Глобальном чате</mark><br><mark style="color:rgb(255, 255, 255);">- local <mark style="color:rgb(156, 156, 156);">- в Локальном чате</mark></mark><br><mark style="color:rgb(255, 255, 255);">- all <mark style="color:rgb(156, 156, 156);">- Во всех чатах</mark></mark><span style="font-size:14px;"></span></p>
{% endhint %}
</div><!--sw-sized-->

### Упоминания

<details>

<summary><mark style="color:$primary;">Как упомянуть ник игрока в чате?</mark></summary>

<p>Чтобы упомянуть игрока в чате, достаточно просто прописать в сообщении <mark style="color:$primary;">@Ник_Игрока</mark></p>

<figure><img src="../.gitbook/assets/image (225).png" alt=""><figcaption></figcaption></figure>

<p>Игрок получит уведомление со звуком, а так же его никнейм будет выделен среди сообщения</p>

</details>

***

## Прочие возможности

| Команда | Обозначение |
| --- | --- |
| /co i | Информация о конкретном блоке и взаимодействиях с ним других игроков |
| /helpop | Написать сообщение администрации сервераНажмите, чтобы узнать подробнее |
| /prefix | Добавляет префикс в TAB и некоторые каналы чатаНажмите чтобы узнать подробнее |
<!--SURWAVE_RICH_FIELDS_V1:%7B%22v%22%3A1%2C%22images%22%3A%5B%22%22%2C%22%22%5D%2C%22mentions%22%3A%5B%5D%2C%22linkgroups%22%3A%5B%5D%2C%22tables%22%3A%5B%5B%5B%22%D0%9A%D0%BE%D0%BC%D0%B0%D0%BD%D0%B4%D0%B0%22%2C%22%D0%A7%D1%82%D0%BE%20%D0%BE%D0%B7%D0%BD%D0%B0%D1%87%D0%B0%D0%B5%D1%82%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%2Fmsg%20%26lt%3B%D0%9D%D0%B8%D0%BA%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%26gt%3B%20%26lt%3B%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%26gt%3B%3C%2Fspan%3E%22%2C%22%D0%9D%D0%B0%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%20%D0%BB%D0%B8%D1%87%D0%BD%D0%BE%D0%B5%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%2Freply%20%26lt%3B%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%26gt%3B%3C%2Fspan%3E%22%2C%22%D0%9E%D1%82%D0%B2%D0%B5%D1%82%D0%B8%D1%82%D1%8C%20%D0%BD%D0%B0%20%D0%BF%D0%BE%D1%81%D0%BB%D0%B5%D0%B4%D0%BD%D0%B5%D0%B5%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%2Fmsg%20mute%20%26lt%3B%D0%9D%D0%B8%D0%BA%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%26gt%3B%3C%2Fspan%3E%22%2C%22%D0%9D%D0%B5%20%D0%BF%D1%80%D0%B8%D0%BD%D0%B8%D0%BC%D0%B0%D1%82%D1%8C%20%D0%BB%D0%B8%D1%87%D0%BD%D1%8B%D0%B5%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%BE%D1%82%20%D1%83%D0%BA%D0%B0%D0%B7%D0%B0%D0%BD%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%2Fmsg%20unmute%20%26lt%3B%D0%9D%D0%B8%D0%BA%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%26gt%3B%3C%2Fspan%3E%22%2C%22%D0%A1%D0%BD%D0%BE%D0%B2%D0%B0%20%D0%BF%D1%80%D0%B8%D0%BD%D0%B8%D0%BC%D0%B0%D1%82%D1%8C%20%D0%BB%D0%B8%D1%87%D0%BD%D1%8B%D0%B5%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%22%5D%5D%2C%5B%5B%22%D0%9A%D0%BE%D0%BC%D0%B0%D0%BD%D0%B4%D0%B0%22%2C%22%D0%A7%D1%82%D0%BE%20%D0%BE%D0%B7%D0%BD%D0%B0%D1%87%D0%B0%D0%B5%D1%82%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%2Fchat%20mute%20%26lt%3B%D0%98%D0%B3%D1%80%D0%BE%D0%BA%26gt%3B%20%26lt%3B%D0%93%D0%B4%D0%B5%20%D0%B7%D0%B0%D0%B3%D0%BB%D1%83%D1%88%D0%B8%D1%82%D1%8C%26gt%3B%3C%2Fspan%3E%22%2C%22%D0%97%D0%B0%D0%B3%D0%BB%D1%83%D1%88%D0%B8%D1%82%D1%8C%20%D0%BE%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D1%91%D0%BD%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%20%D0%B2%D0%B5%D0%B7%D0%B4%D0%B5%20%D0%B8%D0%BB%D0%B8%20%D0%B2%20%D0%BE%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D1%91%D0%BD%D0%BD%D0%BE%D0%BC%20%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%D0%B5%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%2Fchat%20unmute%20%26lt%3B%D0%98%D0%B3%D1%80%D0%BE%D0%BA%26gt%3B%20%26lt%3B%D0%93%D0%B4%D0%B5%20%D1%80%D0%B0%D0%B7%D0%B3%D0%BB%D1%83%D1%88%D0%B8%D1%82%D1%8C%26gt%3B%3C%2Fspan%3E%22%2C%22%D0%A1%D0%BD%D0%BE%D0%B2%D0%B0%20%D0%B2%D0%B8%D0%B4%D0%B5%D1%82%D1%8C%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%BE%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D1%91%D0%BD%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%B0%20%D0%B2%D0%B5%D0%B7%D0%B4%D0%B5%20%D0%B8%D0%BB%D0%B8%20%D0%B2%20%D0%BE%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D1%91%D0%BD%D0%BD%D0%BE%D0%BC%20%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%D0%B5%22%5D%5D%2C%5B%5B%22%D0%9A%D0%BE%D0%BC%D0%B0%D0%BD%D0%B4%D0%B0%22%2C%22%D0%9E%D0%B1%D0%BE%D0%B7%D0%BD%D0%B0%D1%87%D0%B5%D0%BD%D0%B8%D0%B5%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%3Ca%20href%3D%5C%22%23copy%5C%22%20title%3D%5C%22%D0%9D%D0%B0%D0%B6%D0%BC%D0%B8%D1%82%D0%B5%2C%20%D1%87%D1%82%D0%BE%D0%B1%D1%8B%20%D1%81%D0%BA%D0%BE%D0%BF%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%5C%22%3E%2Fco%20i%3C%2Fa%3E%3C%2Fspan%3E%22%2C%22%D0%98%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F%20%D0%BE%20%D0%BA%D0%BE%D0%BD%D0%BA%D1%80%D0%B5%D1%82%D0%BD%D0%BE%D0%BC%20%D0%B1%D0%BB%D0%BE%D0%BA%D0%B5%20%D0%B8%20%D0%B2%D0%B7%D0%B0%D0%B8%D0%BC%D0%BE%D0%B4%D0%B5%D0%B9%D1%81%D1%82%D0%B2%D0%B8%D1%8F%D1%85%20%D1%81%20%D0%BD%D0%B8%D0%BC%20%D0%B4%D1%80%D1%83%D0%B3%D0%B8%D1%85%20%D0%B8%D0%B3%D1%80%D0%BE%D0%BA%D0%BE%D0%B2%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20250%2C%20117%29%5C%22%3E%3Ca%20href%3D%5C%22%23copy%5C%22%3E%2Fhelpop%3C%2Fa%3E%3C%2Fspan%3E%22%2C%22%D0%9D%D0%B0%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%20%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%B0%D0%B4%D0%BC%D0%B8%D0%BD%D0%B8%D1%81%D1%82%D1%80%D0%B0%D1%86%D0%B8%D0%B8%20%D1%81%D0%B5%D1%80%D0%B2%D0%B5%D1%80%D0%B0%3Cbr%3E%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%D0%9D%D0%B0%D0%B6%D0%BC%D0%B8%D1%82%D0%B5%2C%20%D1%87%D1%82%D0%BE%D0%B1%D1%8B%20%D1%83%D0%B7%D0%BD%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%D0%B4%D1%80%D0%BE%D0%B1%D0%BD%D0%B5%D0%B5%3C%2Fspan%3E%22%5D%2C%5B%22%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%3Ca%20href%3D%5C%22%23copy%5C%22%3E%2Fprefix%3C%2Fa%3E%3C%2Fspan%3E%22%2C%22%D0%94%D0%BE%D0%B1%D0%B0%D0%B2%D0%BB%D1%8F%D0%B5%D1%82%20%D0%BF%D1%80%D0%B5%D1%84%D0%B8%D0%BA%D1%81%20%D0%B2%20TAB%20%D0%B8%20%D0%BD%D0%B5%D0%BA%D0%BE%D1%82%D0%BE%D1%80%D1%8B%D0%B5%20%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%D1%8B%20%D1%87%D0%B0%D1%82%D0%B0%3Cbr%3E%3Cspan%20style%3D%5C%22color%3Argb%280%2C%20255%2C%20119%29%5C%22%3E%D0%9D%D0%B0%D0%B6%D0%BC%D0%B8%D1%82%D0%B5%20%D1%87%D1%82%D0%BE%D0%B1%D1%8B%20%D1%83%D0%B7%D0%BD%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%D0%B4%D1%80%D0%BE%D0%B1%D0%BD%D0%B5%D0%B5%3C%2Fspan%3E%22%5D%5D%5D%2C%22servercards%22%3A%5B%5D%7D-->
