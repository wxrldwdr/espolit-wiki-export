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

# Внешняя политика

## Взаимоотношения

### Альянсы

Для заключение альянса, мэр города должен прописать команду <mark style="color:$primary;">/t ally add <Название города></mark>

А мэр другого города может его принять или отклонить

|                                                                       |                          |
| --------------------------------------------------------------------- | ------------------------ |
| <mark style="color:$primary;">/t ally add <Название города></mark>    | Заключить альянс         |
| <mark style="color:$primary;">/t ally remove <Название города></mark> | Расторгнуть альянс       |
| <mark style="color:$primary;">/t ally accept / deny</mark>            | Принять/Отклонить альянс |
| <mark style="color:$primary;">/t allylist</mark>                      | Список городов в альянсе |

Помощь альянса

* Города в альянсе получат уведомление о рейде и завоевании
* Города в альянсе на территории союзных городов получат [<mark style="color:$primary;">положительные эффекты из Построек</mark>](gorodskie-komandy/razvitie-goroda.md#trenirovochnyi-lager)
* Города в альянсе могут помогать союзным городам во время рейдов и завоеваний

### Враги

Так же, город может добавить игрока в список Врагов с помощью команды <mark style="color:$primary;">/t enemy add <Ник игрока></mark>

Если игрок объявлен врагом, при проникновении на территорию города, жители получат уведомление об этом, а так же, на этого игрока будут работать все негативные эффекты из Построек

|                                                                |                                 |
| -------------------------------------------------------------- | ------------------------------- |
| <mark style="color:$primary;">/t enemy add <Ник игрока></mark> | Добавить игрока в список врагов |
| <mark style="color:$primary;">/t enemy remove</mark>           | Удалить игрока из списка врагов |
| <mark style="color:$primary;">/t enemylist</mark>              | Список врагов города            |

## Рейды и завоевания

### Рейды

Рейд — это формат конфликта между городами. В рамках рейда проводится PvP на территориях двух сторон: города-инициатора и города, против которого объявлен рейд.

Чтобы объявить рейд, нужно прописать команду <mark style="color:$primary;">/t raid <Название города></mark>

{% stepper %}
{% step %}
#### Соберите нужное количество ресурсов

Так же понадобится 25 [<mark style="color:$primary;">военных очков</mark>](gorodskie-komandy/drugie-mekhaniki.md#voennye-ochki)!

У города, которому вы хотите объявить рейд, должно быть минимум 2 жителя в игре!

<figure><img src="../.gitbook/assets/image (252).png" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
#### Прописать команду <mark style="color:$primary;">/t raid <Название города></mark>

И если все условия соблюдены, готовьтесь к рейду!
{% endstep %}
{% endstepper %}

Условия для рейда -&#x20;

* Набрать необходимое количество ресурсов в <mark style="color:$primary;">/t inv</mark>
* 25 военных очков - [#voennye-ochki](gorodskie-komandy/drugie-mekhaniki.md#voennye-ochki "mention")
* У города, которому нужно объявить рейд, должно быть 3 и больше жителей в игре

<figure><img src="../.gitbook/assets/image (203).png" alt=""><figcaption></figcaption></figure>

После объявления, для обоих городов начнётся время для подготовки, а города в альянсах обоих городов получат уведомления. <mark style="color:$primary;">Подготовка длится 2 минуты</mark>

<figure><img src="../.gitbook/assets/image (204).png" alt=""><figcaption></figcaption></figure>

После окончания подготовки, начинается рейд, в обоих городах включается PVP режим и жители обоих городов могут атаковать друг друга!

<figure><img src="../.gitbook/assets/image (207).png" alt=""><figcaption></figcaption></figure>

#### <mark style="color:$primary;">**Рейд длится 20 минут.**</mark>

### Завоевание

Завоевание — это улучшенная и дополненная механика рейдов, которая дополнительно включает в себя соперничество за территорию.

{% stepper %}
{% step %}
#### Встать на чанк другого города, который вы хотите захватить

Чанк должен прилегать к территории Вашего города.&#x20;

У города, чанк которого вы хотите завоевать, должно быть минимум 3 человека в игре!
{% endstep %}

{% step %}
#### Соберите нужное количество ресурсов

Так же понадобится 150 [<mark style="color:$primary;">военных очков</mark>](gorodskie-komandy/drugie-mekhaniki.md#voennye-ochki)!

<figure><img src="../.gitbook/assets/image (258).png" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
#### Прописать команду <mark style="color:$primary;">/t conquest</mark>

И если все условия  соблюдены, готовьтесь к завоеванию! <mark style="color:$primary;">Подготовка длится 2 минуты.</mark>

<figure><img src="../.gitbook/assets/image (251).png" alt=""><figcaption></figcaption></figure>
{% endstep %}
{% endstepper %}

#### Процесс завоевания

После завершения подготовки к завоеванию, чанк города подсветится специальными эффектами.&#x20;

<figure><img src="../.gitbook/assets/image (247).png" alt=""><figcaption></figcaption></figure>

* <mark style="color:$primary;">**Цель для защитников**</mark> - Не позволить атакующим набрать нужного количества очков по завершению рейда
* <mark style="color:$primary;">**Цель атакующих**</mark> - Набрать нужное количество очков и дождаться окончания таймера\\

<details>

<summary><mark style="color:$primary;">Как заработать очки?</mark></summary>

Очки выдаются за:

* Убийство защищающихся врагов на территории обоих городов
* Удержание чанка только атакующей территории

<figure><img src="../.gitbook/assets/image (248).png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;">Как убавить очки противника?</mark></summary>

Очки убавляются если:

* Убийство атакующих врагов на территории обоих городов
* На чанке присутствует только игроки защиты

<figure><img src="../.gitbook/assets/image (249).png" alt=""><figcaption></figcaption></figure>

</details>

По завершению рейда, если у атакующей стороны есть нужное количество очков, участок переходит им во владение

<figure><img src="../.gitbook/assets/image (257).png" alt=""><figcaption></figcaption></figure>

#### <mark style="color:$primary;">**Завоевание длится 30 минут.**</mark>

## Территориальные претензии

Территориальные претензии - особый тип территории, который поможет городам помечать территорию, которую город рассчитывает заприватить позже.&#x20;

<figure><img src="../.gitbook/assets/image (254).png" alt=""><figcaption></figcaption></figure>

Для того, чтобы пометить территорию Территориальной претензией, пропишите команду <mark style="color:$primary;">/t pretend.</mark>

<figure><img src="../.gitbook/assets/image (255).png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
Если территорию вашей территориальной претензии присваивает другой город, Ваш город получает уведомление!
{% endhint %}

<figure><img src="../.gitbook/assets/image (256).png" alt=""><figcaption></figcaption></figure>
