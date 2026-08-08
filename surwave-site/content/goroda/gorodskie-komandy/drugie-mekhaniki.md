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

# Другие механики

## Активность

<mark style="color:$primary;">Очки активности - показатель развития города и активности его игроков</mark>

Она основывается на:

* Количестве жителей
* Количестве заприваченных участков
* Количества Аутпостов

Так же, очки активности могут прибавляться за:

* Активацию некоторых Построек
* Успешную оплату налога
* Победа в завоевании, если Вам объявили завоевание
* [<mark style="color:$primary;">PayDay игроков</mark>](drugie-mekhaniki.md#payday)
* Прокачке Веков
* <mark style="color:$primary;">Рефералов</mark>, которые вступили к вам в город
* Голосования за сервер на мониторингах
* Выполнение городских квестов
* Участие в Ивентах
* Участие в Общих квестах

И изыматься за:

* Объявление рейдов и завоеваний
* Переименование города
* Каждый день в режиме банкротства

#### Как узнать активность своего города?

Активность отображается в панели города по команде <mark style="color:$primary;">/town</mark>

А так же по команде <mark style="color:$primary;">/t rating</mark>

<p align="center"><img src="../../.gitbook/assets/image (1).png" alt="" data-size="original"></p>

Топ городов по активности

Чтобы открыть <mark style="color:$primary;">Топ-10 городов по активности</mark>, пропишите команду <mark style="color:$primary;">/t rating top</mark>

<figure><img src="../../.gitbook/assets/image (2).png" alt=""><figcaption></figcaption></figure>

***

## Военные очки

Это параметр, который требуется для объявления рейдов и завоеваний.

<mark style="color:$primary;">Военные очки пополняются ежедневно</mark>, но пополнить вручную их можно с помощью [<mark style="color:$primary;">специальных Построек</mark>](razvitie-goroda.md#voodushevlenie), а лимит военных очков [<mark style="color:$primary;">можно увеличить в меню Освоения</mark>](razvitie-goroda.md#voodushevlenie)

Текущее количество военных очков можно в меню города по команде <mark style="color:$primary;">/town</mark>

***

## Общие квесты

Это событие, которое активируют администраторы сервера.

Есть несколько типов квестов

* <mark style="color:$primary;">Соревнование</mark>
* <mark style="color:$primary;">Кооператив</mark>

<figure><img src="../../.gitbook/assets/image (156).png" alt=""><figcaption></figcaption></figure>

После получения уведомления в чате, пропиши команду <mark style="color:$primary;">/quest accept</mark> и сверху появится прогресс собранных ресурсов.

{% hint style="info" %}
Во время Кооперативного квеста, прогресс будет заполняться по мере выполнение квестов всеми участвующими игроками!
{% endhint %}

|                                                    |                                              |
| -------------------------------------------------- | -------------------------------------------- |
| <mark style="color:$primary;">/quest accept</mark> | Принять квест                                |
| <mark style="color:$primary;">/quest time</mark>   | Оставшееся время квеста                      |
| <mark style="color:$primary;">/quest top</mark>    | Посмотреть текущий прогресс игроков в квесте |

#### Награды

Награда выдаётся Топ-5 участников:

* [<mark style="color:$primary;">Очки активности города</mark>](drugie-mekhaniki.md#aktivnost), в котором состоят игроки
* [<mark style="color:$primary;">Е</mark><mark style="color:$primary;">койны</mark>](drugie-mekhaniki.md#ekoiny)

Во время кооперативного квеста, награды будут поделены в зависимости от вашего процента от общего количества

***

## Екойны

Екойны - донатная валюта, на которую можно купить предметы из донатного магазина.

Зарабатываются за активность на сервере.

{% hint style="info" %}
Пока что их тратить негде! Раздел в разработке!
{% endhint %}

***

## PayDay

<mark style="color:$primary;">Пейдей</mark> - механика, позволяющая городам получать больше <mark style="color:$primary;">Очков активности</mark>, а игрокам получаемые <mark style="color:$primary;">Екойны</mark> в качестве благодарности за активность на сервере

<mark style="color:$primary;">Как это работает?</mark>

В течение временных промежутков длиной в 4 часа, если игрок наиграл из них 1 час, то городу зачисляется <mark style="color:$primary;">2 очка активности за каждого игрока</mark>

{% hint style="info" %}
В выходные дни (Суббота и Воскресенье), а так же во время проводимых ивентов, <mark style="color:$primary;">количество очков активности получаемых во время PayDay умножается на 2</mark>!
{% endhint %}

{% hint style="warning" %}
Время PayDay не учитывает время проведённое во время AFK!
{% endhint %}
