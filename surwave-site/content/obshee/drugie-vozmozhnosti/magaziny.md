---
description: Механика безопасной продажи и покупки ресурсов
---

# Магазины

## Как создать магазин?

{% stepper %}
{% step %}
### Поставь сундук и пропиши команду <mark style="color:$primary;">/shop</mark>

<figure><img src="../../.gitbook/assets/image (16).png" alt=""><figcaption></figcaption></figure>

Откроется меню, где необходимо настроить магазин
{% endstep %}

{% step %}
### Настрой магазин

<figure><img src="../../.gitbook/assets/image (17).png" alt=""><figcaption></figcaption></figure>

1\) Выбери режим магазина <mark style="color:$primary;">"Скупка"</mark> или <mark style="color:$primary;">"Продажа"</mark>

2\) Выбери продаваемый товар. Это можно сделать по кнопке <mark style="color:cyan;">\[Добавить]</mark> и указать ресурс можно как из руки, так и введя ID ресурса в чат

3\) Установи минимальное количество продаваемого товара. Если укажешь 3 вместо 1, то покупатель сможет купить только количество ресурсов <mark style="color:$primary;">кратное указанному числу</mark>.&#x20;

4\) Так же как и в товаре, <mark style="color:$primary;">укажи ресурс оплаты</mark> - то, что ты хочешь получить

5\) Укажи, сколько ресурсов ты хочешь получить. <mark style="color:$primary;">Имей в виду, что ты указываешь стоимость за указанное минимальное количество ресурсов</mark>
{% endstep %}

{% step %}
### Создай магазин!

<figure><img src="../../.gitbook/assets/image (19).png" alt=""><figcaption></figcaption></figure>

После создания магазина, сундук преобразится. <mark style="color:$primary;">Сломать данный сундук сможешь только ты или глава города, в котором ты состоишь</mark>

Так же, прописав команду <mark style="color:$primary;">/shop</mark> по уже созданному сундуку, ты можешь редактировать текущий магазин

<figure><img src="../../.gitbook/assets/image (20).png" alt=""><figcaption></figcaption></figure>
{% endstep %}

{% step %}
### Положи продаваемый товар в сундук

Так как в сундуке есть 2 режима, для опции <mark style="color:$primary;">Продажи</mark> необходимо положить ресурсы, которые ты хочешь продать, а для опции <mark style="color:$primary;">Скупки</mark> необходимо положить ресурсы в качестве оплаты.

<figure><img src="../../.gitbook/assets/image (21).png" alt=""><figcaption></figcaption></figure>


{% endstep %}

{% step %}
### Ожидай кучи клиентов!

Надеемся, что именно у тебя будет самый крутой и доступный магазин!

<figure><img src="../../.gitbook/assets/image (22).png" alt=""><figcaption></figcaption></figure>
{% endstep %}
{% endstepper %}

***

## Выручка

После покупки ты получишь уведомление в чате. Вся выручка со всех магазинов будет лежать в меню по команде <mark style="color:$primary;">/shop cash</mark>

<figure><img src="../../.gitbook/assets/image (23).png" alt=""><figcaption></figcaption></figure>

***

## Магазин алкоголя

<mark style="color:$primary;">Умеешь варить алкоголь?</mark> Пора доказать массам качество твоего алкоголя!

Чтобы создать магазин напитков, всё сделай так же, только вместо сундука используй бочку!

{% hint style="info" %}
А подробнее о доступных алкогольных напитках ты можешь узнать в - [recepty-brewery.md](../../dopolneniya/recepty-brewery.md "mention"), а так же о том, как их варить в - [varka-napitkov.md](varka-napitkov.md "mention")
{% endhint %}



<figure><img src="../../.gitbook/assets/image (24).png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
В каждый магазин с алкоголем можно положить только один вид алкоголя
{% endhint %}

***

## Скидки в магазинах

{% hint style="info" %}
Настройка скидок возможна только в режиме "Продажа" при создании или редактировании магазина
{% endhint %}

Чтобы перейти к настройке скидок, создай или войди в режим редактирования магазина и нажми по кнопке <mark style="color:cyan;">\[Настройка скидок]</mark>

<figure><img src="../../.gitbook/assets/image (25).png" alt=""><figcaption></figcaption></figure>

Для настройки новой стоимости просто нажимай на стрелочки. Доступны изменения цен для:

* <mark style="color:$primary;">Городов в альянсе</mark> (Стоимость можно сделать ниже)
* <mark style="color:$primary;">Враги города</mark> (Стоимость можно сделать выше)
* <mark style="color:$primary;">Покупка оптом</mark>
  * Нужно выбрать количество товара, от которого начнётся скидка. То есть, если указать 30, то даже при минимальной покупке 6, новая стоимость будет рассчитываться только при покупки от количества 30 и более!

***

## Как найти магазины игроков?

Можешь поинтересоваться у игроков, есть ли у них магазины и какой товар у них продаётся

Но так же, прописав команду <mark style="color:$primary;">/shop find</mark> или <mark style="color:$primary;">/shop find <Ник игрока></mark>, нужные тебе магазины будут подсвечены!

<figure><img src="../../.gitbook/assets/image (26).png" alt=""><figcaption></figcaption></figure>

Так же, в чате тебе покажет координаты магазинов, а нажав на них, тебе подсветит местоположение того или иного магазина!

<figure><img src="../../.gitbook/assets/image (27).png" alt=""><figcaption></figcaption></figure>

***

## Лимиты магазинов

Для магазинов есть лимиты того, сколько их можно создать на определённом чанке

<mark style="color:$primary;">Вне города:</mark> 2 магазина

<mark style="color:$primary;">На территории посольства в чужом городе:</mark> 10 магазинов

<mark style="color:$primary;">В своём городе:</mark> Любое количество

