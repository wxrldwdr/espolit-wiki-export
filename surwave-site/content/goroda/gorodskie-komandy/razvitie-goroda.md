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

# Развитие города

## Городской налог

После того, как Вы создали город, нужно в первую очередь подумать о его содержании!

Откройте текущее содержание города через кнопку на панели <mark style="color:$primary;">/t</mark>, или по команде <mark style="color:$primary;">/t daily</mark>

<figure><img src="../../.gitbook/assets/image (103).png" alt=""><figcaption></figcaption></figure>

Городской налог оплачивается с помощью ресурсов, которые необходимо положить в городской инвентарь по команде <mark style="color:$primary;">/t inv и /</mark><mark style="color:$primary;">t stock</mark>

Он складывается из:

* Количества текущих территорий (1 железный слиток x 1  территория)
* Количества жителей (2 железных слитка x 1 житель)
* Количества Аутпостов (5 алмазов x 1 Аутпост)
* Факта становления вашего города столицей нации (32 алмаза)

> А если я не буду оплачивать налог?

Тогда город просто войдёт в режим Банкротства!

### Банкротство

Банкротство - небольшая отсрочка по времени, когда город должен оплатить налог, иначе, город удалится по истечению времени!



Во время банкротства будет заблокировано большинство городских команд и систем, до того момента, пока вы не погасите налог.

Узнать сколько дней осталось до окончания банкротства можно просто зайдя в город и увидев надпись:

<figure><img src="../../.gitbook/assets/image (104).png" alt=""><figcaption></figcaption></figure>

#### Как погасить налог?

Очень просто! Просто положите необходимые ресурсы в <mark style="color:$primary;">/t inv</mark> или активируйте нужные постройки, чтобы ресурсы были в <mark style="color:$primary;">/t stock</mark> и далее налог будет погашен по достижению нового дня. Или же, можно оплатить налог досрочно, прописав команду <mark style="color:$primary;">/t daily</mark> и нажав на кнопку <mark style="color:$success;">\[Оплатить налог]</mark>

<figure><img src="../../.gitbook/assets/image (11).png" alt=""><figcaption></figcaption></figure>

И всё! Долг погашен, все функции разблокированы!

#### Оплата налога на несколько дней вперёд

Если в городе достаточно ресурсов, возможна оплата налога на несколько дней вперёд, для этого, нужно несколько раз  <mark style="color:$success;">\[Оплатить налог]</mark> (Максимум - 3 дня наперёд)

***

## Ежедневные задания

Каждый день, после обновления нового дня, у города обновляются и ежедневные задания!

Выполнять эти квесты может каждый игрок, незавимо от ранга. И даже несколько игроков могут присоединиться к выполнению довольно сложных квестов!

Чтобы посмотреть текущие квесты, пропишите команду <mark style="color:$primary;">/t quest</mark>:

<figure><img src="../../.gitbook/assets/image (12).png" alt=""><figcaption></figcaption></figure>

Типы квестов которые могут вам встретиться:

* Крафт
* Починить
* Убить моба
* Убить игрока
* Зачаровать
* Переплавить
* Рыбалка
* Пригласить в город
* Добыть
* Взаимодействовать

Естественно, за эти квесты положена награда! В качестве награды можно получить как <mark style="color:$primary;">Городские очки активности</mark>, так и <mark style="color:$primary;">Донатную валюту</mark> для того, кто завершил этот квест!

***

## Городской инвентарь

Городской инвентарь - буквально склад для ресурсов, которые потребуются для прокачек и оплаты налога. Но в нём так же можно хранить и личные вещи.

Чтобы открыть городской склад, пропишите команду <mark style="color:$primary;">/t inv</mark>

<figure><img src="../../.gitbook/assets/image (4).png" alt=""><figcaption></figcaption></figure>

### Логи городского инвентаря

Городской инвентарь так же оснащён просмотром логов последних взаимодействий с ним. С его помощью можно выяснить кто что брал из него или положил.

Чтобы открыть лог, пропишите команду <mark style="color:$primary;">/t inv manage</mark>. Тогда откроется <mark style="color:$primary;">последние 10 действий</mark>, которые были сделаны игроком.

Но если нужны логи одного игрока, пропишите команду <mark style="color:$primary;">/t inv manage <Ник игрока></mark> и тогда он выведет последние 10 действий именно этого игрока.

<figure><img src="../../.gitbook/assets/image (107).png" alt=""><figcaption></figcaption></figure>

### Цели

<figure><img src="../../.gitbook/assets/image (5).png" alt=""><figcaption></figcaption></figure>

Перейдя в инвентарь, вы увидите кнопку <mark style="color:$primary;">Цели</mark>

Цели - вспомогательная механика, которая помогает отслеживать прогресс набора ресурсов <mark style="color:$primary;">для Городских построек и Освоения</mark>

Для отображения информации, кликните <mark style="color:$primary;">Колёсиком мыши</mark> по любому из Построек или Веток Освоения

<figure><img src="../../.gitbook/assets/image (6).png" alt=""><figcaption></figcaption></figure>

### Дополнительные возможности

#### Оплата налога

Прямо в городском инвентаре можно следить за городским налогом а так же оплатить налог и будущие дни для оплаты налога!

<figure><img src="../../.gitbook/assets/image (7).png" alt=""><figcaption></figcaption></figure>

#### Доступ к Городскому складу

С помощью кнопки <mark style="color:pink;">\[Склад города]</mark> можно быстро перейти на городской склад, где складируются ресурсы полученные в Постройках

<figure><img src="../../.gitbook/assets/image (8).png" alt=""><figcaption></figcaption></figure>

***

## Постройки

Постройки помогут вам в получении необходимых ресурсов для прочих прокачек, а так же в защите города!

Пропишите команду <mark style="color:$primary;">/t builds</mark>, и вы увидите все доступные на сервере постройки:

<figure><img src="../../.gitbook/assets/image (109).png" alt=""><figcaption></figcaption></figure>

Рассмотрим постройки на примере:

<figure><img src="../../.gitbook/assets/image (110).png" alt=""><figcaption></figcaption></figure>

Есть несколько блоков

* Что даёт та или иная постройка
* Что нужно для запуска
* Следующий уровень

Для запуска постройки необходимо положить указанные ресурсы в <mark style="color:$primary;">/t inv</mark>, но для высокоранговых построек для запуска потребуется ещё и набрать нужное количество Городских очков активности. После того, как набрали нужное количество ресурсов, для запуска нужно нажать на левую кнопку мыши!

Для прокачки здания так же нужно положить ресурсы в <mark style="color:$primary;">/t inv</mark>, после нажать на правую кнопку мыши.

{% hint style="info" %}
За активацию некоторых построек могут как изыматься, так и добавляться очки активности
{% endhint %}

### Шахта

Шахта добывает определённое количество ресурсов, помещая их в <mark style="color:$primary;">/t stock</mark> по истечению времени. Постройку необходимо запустить заново для возобновления.

<figure><img src="../../.gitbook/assets/image (111).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Каменоломня</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 64 булыжника за 30 минут
* <mark style="color:$primary;">Уровень 2</mark>: Добывает 256 булыжника за 1 час
* <mark style="color:$primary;">Уровень 3</mark>: Добывает 32 камня за 20 минут
* <mark style="color:$primary;">Уровень 4:</mark> Добывает 64 камня за 30 минут
* <mark style="color:$primary;">Уровень 5:</mark> Добывает 256 камня за 1 час 30 минут

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча лазурита</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 64 лазурита за 40 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 128 лазурита за 1 час
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 16 лазуритовых блоков за 1 час
* <mark style="color:$primary;">Уровень 4:</mark> Добывает 32 лазуритовых блока за 1 час
* <mark style="color:$primary;">Уровень 5:</mark> Добывает 64 лазуритовых блоков за 1 час 30 минут

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча редстоуна</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 64 редстоуна за 40 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 128 редстоуна за 1 час
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 16 редстоуновых блоков за 1 час
* <mark style="color:$primary;">Уровень 4:</mark> Добывает 32 редстоуновых блока за 1 час
* <mark style="color:$primary;">Уровень 5:</mark> Добывает 64 редстоуновых блоков за 1 час 30 минут

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча кварца</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 кварца за 20 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 128 кварца за 1 час

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча глины</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 128 глины за 3 часа
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 512 глины за 5 часов
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 1024 глины за 7 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча железа</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 70 железных слитков за 2 часа
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 16 железных блоков за 3 часа

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча алмазов</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 алмазов за 1 час
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 40 алмазов за 2 часа 30 минут

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча незерита</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 4 древних обломка за 2 часа
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 8 древних обломка за 3 часа
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 12 ед. незеритового лома за 4 часа
* <mark style="color:$primary;">Уровень 4:</mark> Добывает 36 ед. незеритового лома за 10 часов
* <mark style="color:$primary;">Уровень 5:</mark> Добывает 2 незеритовых слитка за 1 час

</details>

<details>

<summary><mark style="color:$primary;"><strong>Добыча светопыли</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 5 ед. светокамня за 3 часа
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 16 ед. светокамня за 9 часов
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 128 светопыли за 12 часов

</details>

### Лесопилка

Шахта добывает определённое количество ресурсов, помещая их в <mark style="color:$primary;">/t stock</mark> по истечению времени. Постройку необходимо запустить заново для возобновления.

<figure><img src="../../.gitbook/assets/image (113).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка дуба</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 дубовых брёвен за 30 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 дубовых брёвен за 1 час 30 минут
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 дубовых брёвен за 3 часа

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка берёзы</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 берёзовых брёвен за 30 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 берёзовых брёвен за 2 часа
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 берёзовых брёвен за 5 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка тёмного дуба</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен тёмного дуба за 30 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен тёмного дуба за 1 час 30 минут
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен тёмного дуба за 2 часа 30 минут

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка ели</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен ели за 15 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен ели за 40 минут
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен ели за 2 часа

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка бледного дуба</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен бледного дуба за 1 час
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен бледного дуба за 3 часа
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен бледного дуба за 8 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка тропического дерева</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен тропического дерева за 40 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен тропического дерева за 2 часа
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен тропического дерева за 5 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка акации</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен акации за 1 час
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен акации за 3 часа
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен акации за 8 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка мангрового дерева</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен мангрового дерева за 30 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен мангрового дерева за 1 час 30 минут
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен мангрового дерева за 3 часа

</details>

<details>

<summary><mark style="color:$primary;"><strong>Вырубка вишнёвого дерева</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Добывает 16 брёвен вишнёвого дерева за 20 минут
* <mark style="color:$primary;">Уровень 2:</mark> Добывает 64 брёвен вишнёвого дерева за 1 час
* <mark style="color:$primary;">Уровень 3:</mark> Добывает 256 брёвен вишнёвого дерева за 3 часа

</details>

### Библиотека

Библиотека увеличивает получаемый игроками города опыт на указанный в постройке процент. Действует в течение определённого времени или навсегда

<figure><img src="../../.gitbook/assets/image (114).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Опыт +10%</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Прибавляет +10% к получаемому опыту в течение 3 часов
* <mark style="color:$primary;">Уровень 2:</mark> Навсегда прибавляет +10% к получаемому опыту навсегда

</details>

<details>

<summary><mark style="color:$primary;"><strong>Опыт +50%</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Прибавляет +50% к получаемому опыту в течение 30 минут
* <mark style="color:$primary;">Уровень 2:</mark> Прибавляет +50% к получаемому опыту в течение 5 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Опыт +100%</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Прибавляет +100% к получаемому опыту в течение 30 минут
* <mark style="color:$primary;">Уровень 2:</mark> Прибавляет +100% к получаемому опыту в течение 5 часов

</details>

<details>

<summary><mark style="color:$primary;"><strong>Опыт +500%</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Прибавляет +500% к получаемому опыту в течение 1 минуты
* <mark style="color:$primary;">Уровень 2:</mark> Прибавляет +500% к получаемому опыту в течение 5 минут

</details>

### Тренировочный лагерь

Тренировочный лагерь накладывает на жителей вашего города положительные эффекты в пределах города или повсеместно, в течение определённого времени или навсегда.&#x20;

{% hint style="info" %}
Положительные эффекты распространяются на игроках из городов в альянсе, если они проникли на Вашу территорию
{% endhint %}

Постройка <mark style="color:$primary;">"Воодушевление"</mark> восстанавливает городу военные очки

<figure><img src="../../.gitbook/assets/image (115).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Эффекты скорости</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Даёт жителям следующие  эффекты в течение 4 часов:
  * "Скорость I" <mark style="color:$primary;">в пределах города</mark>
* <mark style="color:$primary;">Уровень 2:</mark> Даёт жителям следующие  эффекты в течение 4 часов:
  * "Скорость I" <mark style="color:$primary;">повсеместно</mark>
* <mark style="color:$primary;">Уровень 3:</mark> Навсегда даёт жителям следующие эффекты:
  * "Скорость I" <mark style="color:$primary;">повсеместно</mark>
  * "Плетение" <mark style="color:$primary;">повсеместно</mark>

</details>

<details>

<summary><mark style="color:$primary;"><strong>Плавание</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Даёт жителям следующие  эффекты в течение 5 часов:
  * "Подводное дыхание" <mark style="color:$primary;">в пределах города</mark>
* <mark style="color:$primary;">Уровень 2:</mark> Даёт жителям следующие  эффекты в течение 3 часа:
  * "Подводное дыхание" <mark style="color:$primary;">в пределах города</mark>
  * "Сила  источника" <mark style="color:$primary;">в пределах города</mark>
* <mark style="color:$primary;">Уровень 3:</mark> Навсегда даёт жителям следующие эффекты:
  * "Подводное дыхание" <mark style="color:$primary;">в пределах города</mark>
  * "Сила источника" <mark style="color:$primary;">в пределах города</mark>
  * "Грация дельфина" <mark style="color:$primary;">в пределах города</mark>

</details>

<details>

<summary><mark style="color:$primary;"><strong>Стойкость</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Даёт жителям следующие  эффекты в течение 2 часов:
  * "Насыщение" <mark style="color:$primary;">в пределах города</mark>
* <mark style="color:$primary;">Уровень 2:</mark> Даёт жителям следующие  эффекты в течение 3 часа:
  * "Насыщение" <mark style="color:$primary;">в пределах города</mark>
  * "Огнестойкость" <mark style="color:$primary;">в пределах города</mark>
* <mark style="color:$primary;">Уровень 3:</mark> Навсегда даёт жителям следующие эффекты:
  * "Насыщение" <mark style="color:$primary;">в пределах города</mark>
  * "Огнеупорность" <mark style="color:$primary;">в пределах города</mark>
  * "Регенерация" <mark style="color:$primary;">в пределах города</mark>

</details>

<details>

<summary><mark style="color:$primary;"><strong>Воодушевление</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Даёт городу 30 военных очков за 3 часа
* <mark style="color:$primary;">Уровень 2:</mark> Даёт городу 100 военных очков за 6 часов
* <mark style="color:$primary;">Уровень 3:</mark> Даёт городу 200 военных очков за 10 часов

</details>

### Оборона

Оборона накладывает на врагов города отрицательные эффекты, если они находятся на вашей территории. Распространяется на нападающих в захватах, не зависимо от наличия статуса врага города.

<figure><img src="../../.gitbook/assets/image (116).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Зрительные эффекты</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Накладывает на врагов следующие  эффекты в течение 2 часов:
  * "Тошнота"
* <mark style="color:$primary;">Уровень 2:</mark> Даёт жителям следующие  эффекты в течение 4 часов:
  * "Тошнота"
  * "Свечение"
* <mark style="color:$primary;">Уровень 3:</mark> Навсегда даёт жителям следующие эффекты:
  * "Тошнота"
  * "Свечение"
  * "Слепота"

</details>

<details>

<summary><mark style="color:$primary;"><strong>Физические эффекты</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Накладывает на врагов следующие эффекты в течение 2 часов:
  * "Замедление"
* <mark style="color:$primary;">Уровень 2:</mark> Накладывает на врагов следующие эффекты в течение 2 часов:
  * "Замедление"
  * "Отравление"
* <mark style="color:$primary;">Уровень 3:</mark> Накладывает на врагов следующие эффекты в течение 1 часа:
  * "Замедление"
  * "Отравление"
  * "Слабость"

</details>

***

## Освоение

Данное меню подразумевает собой обычную прокачку различных параметров города

Чтобы открыть меню, пропишите команду <mark style="color:$primary;">/t grow</mark>

<figure><img src="../../.gitbook/assets/image (117).png" alt=""><figcaption></figcaption></figure>



В меню Освоения всего 4 ветки развития

* Расширение
* Военная подготовка
* Грамота
* Ремесло

### Расширение

Направлено на улучшение территорий и налогообложения

<figure><img src="../../.gitbook/assets/image (144).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Территории</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Повышает максимальный лимит участков на 15
* <mark style="color:$primary;">Уровень 2:</mark> Повышает максимальный лимит участков на 30
* <mark style="color:$primary;">Уровень 3:</mark> Повышает максимальный лимит участков на 70
* <mark style="color:$primary;">Уровень 4:</mark> Повышает максимальный лимит участков на 130
* <mark style="color:$primary;">Уровень 5:</mark> Повышает максимальный лимит участков на 200

</details>

<details>

<summary><mark style="color:$primary;"><strong>Далёкие земли</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Повышает максимальный лимит Аутпостов на 1
* <mark style="color:$primary;">Уровень 2:</mark> Повышает максимальный лимит Аутпостов на 1
* <mark style="color:$primary;">Уровень 3:</mark> Повышает максимальный лимит Аутпостов на 3

</details>

<details>

<summary><mark style="color:$primary;"><strong>Налогообложение</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Повышает количество дней без оплаты налога на 1
* <mark style="color:$primary;">Уровень 2:</mark> Повышает количество дней без оплаты налога на 2
* <mark style="color:$primary;">Уровень 3:</mark> Повышает количество дней без оплаты налога на 4

</details>

### Военная подготовка

Направлено на улучшение военного потенциала

<figure><img src="../../.gitbook/assets/image (145).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Военное дело</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Повышает лимит военных очков на 200
* <mark style="color:$primary;">Уровень 2:</mark> Повышает лимит военных очков на 500
* <mark style="color:$primary;">Уровень 3:</mark> Повышает лимит военных очков на 700

</details>

<details>

<summary><mark style="color:$primary;"><strong>Боевой клич</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Понижает время ожидания между рейдами на 10%
* <mark style="color:$primary;">Уровень 2:</mark> Понижает время ожидания между рейдами на 20%
* <mark style="color:$primary;">Уровень 3:</mark> Понижает время ожидания между рейдами на 30%

</details>

<details>

<summary><mark style="color:$primary;"><strong>Сплочённость</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Повышает количество времени восстановления после завоевания на 10%
* <mark style="color:$primary;">Уровень 2:</mark> Повышает количество времени восстановления после завоевания на 20%
* <mark style="color:$primary;">Уровень 3:</mark> Повышает количество времени восстановления после завоевания на 30%

</details>

### Грамота

Направлено на улучшение городских систем

<figure><img src="../../.gitbook/assets/image (146).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Рабочая реформа</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Повышает лимит ежедневных квестов на 2
* <mark style="color:$primary;">Уровень 2:</mark> Повышает лимит ежедневных квестов на 3
* <mark style="color:$primary;">Уровень 3:</mark> Повышает лимит ежедневных квестов на 5

</details>

<details>

<summary><mark style="color:$primary;"><strong>Достаток</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Получаемые жителями Екойны повышаются на 10%
* <mark style="color:$primary;">Уровень 2:</mark> Получаемые жителями Екойны повышаются на 30%
* <mark style="color:$primary;">Уровень 3:</mark> Получаемые жителями Екойны повышаются на 50%

</details>

<details>

<summary><mark style="color:$primary;"><strong>Престиж</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark> Получаемые очки активности города повышаются на 10%
* <mark style="color:$primary;">Уровень 2:</mark> Получаемые очки активности города повышаются на 30%
* <mark style="color:$primary;">Уровень 3:</mark> Получаемые очки активности города повышаются на 50%

</details>

### Ремесло

Направлено на открытие возможность для жителей города

<p align="center"><img src="../../.gitbook/assets/image (9).png" alt="" data-size="original"></p>

<details>

<summary><mark style="color:$primary;"><strong>Незер-портал</strong></mark></summary>

Изначально, жители города не могут строить незер-порталы. Для доступа к нему, необходимо прокачать ремесло "Незер-портал"

<figure><img src="../../.gitbook/assets/image (10).png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;"><strong>Расширение городского инвентаря</strong></mark></summary>

Базовое количество слотов городского инвентаря - <mark style="color:$primary;">36 cлотов (1 страница)</mark>

* <mark style="color:$primary;">Уровень 1:</mark> Увеличение количества страниц городского инвентаря на 1
* <mark style="color:$primary;">Уровень 2:</mark> Увеличение количества страниц городского инвентаря на 1

</details>

***

## Формы правления

Направлены так же на прокачку города, в зависимости от выбора формы правления и идеологии

Чтобы выбрать форму правления, напишите команду <mark style="color:$primary;">/t form</mark>

<figure><img src="../../.gitbook/assets/image (148).png" alt=""><figcaption></figcaption></figure>

Есть две формы правления

* <mark style="color:$primary;">**Республика**</mark> - Форма правления направленная на внутреннее развитие города
* <mark style="color:$primary;">**Монархия**</mark> - Форма правления направленная внешнее развитие города и военное дело

{% hint style="danger" %}
Форму правления и идеологию нельзя сменить! Ваш выбор окончательный!
{% endhint %}

После выбора формы правления, необходимо выбрать одну из идеологий вашего города, бонусы идеологии будут применены сразу после выбора.

У каждой идеологии есть как минусы, так и плюсы



### Республика

Форма правления направленная на внутреннее развитие города

Уровень идеологии так же можно повышать. Для прокачки так же требуются ресурсы, очки активности и успешные дни

{% hint style="info" %}
<mark style="color:$primary;">**Успешный день**</mark> - дни оплаты налога, отсчитываемые после выбора формы правления и идеологии
{% endhint %}

<figure><img src="../../.gitbook/assets/image (149).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Демократия</strong></mark></summary>

*   <mark style="color:$primary;">Уровень 1:</mark>

    * Повышает получаемые очки активности на 20%
    * Уменьшение требования к развитию Века на 15%
    * Увеличение времени ожидания перед новым рейдом на 30%


* <mark style="color:$primary;">Уровень 2:</mark>
  * Повышает получаемые очки активности  на 50%
  * Уменьшены требования к развитию века на 25%
  * Длительность построек с добычей ресурсов на 20% дольше
  * Увеличение времени ожидания перед новым рейдом на 50%

</details>

<details>

<summary><mark style="color:$primary;"><strong>Капитализм</strong></mark></summary>

*   <mark style="color:$primary;">Уровень 1:</mark>

    * Ежедневное повышение очков активности города на 5 ед.
    * Постройки добывают больше ресурсов на 20%
    * Повышение городского налога на 20%


* <mark style="color:$primary;">Уровень 2:</mark>
  * Ежедневное повышение очков активности города на 15 ед.
  * Постройки добывают больше ресурсов на 40%
  * Постройки добывают больше ресурсов на 2% от каждого жителя в игре
  * Повышение городского налога на 30%

</details>

<details>

<summary><mark style="color:$primary;"><strong>Социализм</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Стоимость покупки и активации построек понижена на 10%
  * Понижение городского налога на 10%
  * Город получает на 10% меньше очков активности



* <mark style="color:$primary;">Уровень 2:</mark>
  * Стоимость покупки и активации построек понижена на 20%
  * Понижение городского налога на 20%
  * Постройки добывают больше ресурсов на 30%
  * Город получает на 30% меньше очков активности

</details>

<details>

<summary><mark style="color:$primary;"><strong>Коммунизм</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Стоимость покупки и активации построек понижена на 20%
  * Скорость ресурсных построек увеличена на 20%
  * Город получает на 15% меньше рейтинга



* <mark style="color:$primary;">Уровень 2:</mark>
  * Стоимость покупки и активации построек понижена на 20%
  * Скорость ресурсных построек увеличена на 25%
  * Сокращение времени работы ресурсных построек на 2% за каждого жителя в игре
  * Город получает на 50% меньше рейтинга

</details>

### Монархия

Форма правления направленная внешнее развитие города и военное дело

Уровень идеологии так же можно повышать. Для прокачки так же требуются ресурсы, очки активности и успешные дни

{% hint style="info" %}
<mark style="color:$primary;">**Успешный день**</mark> - дни оплаты налога, отсчитываемые после выбора формы правления и идеологии
{% endhint %}

<figure><img src="../../.gitbook/assets/image (150).png" alt=""><figcaption></figcaption></figure>

<details>

<summary><mark style="color:$primary;"><strong>Монократия</strong></mark></summary>

*   <mark style="color:$primary;">Уровень 1:</mark>

    * Понижение времени ожидания между рейдами на 20%
    * Рейды и завоевания не влияют на очки активности
    * Повышение городского налога на 20%


* <mark style="color:$primary;">Уровень 2:</mark>
  * Понижение времени ожидания между рейдами на 40%
  * Рейды и завоевания не влияют на очки активности
  * Ежедневное повышение очков активности города на 15 ед.
  * Повышение городского налога на 40%



</details>

<details>

<summary><mark style="color:$primary;"><strong>Самодержавие</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Ежедневное повышение очков активности города на 30 ед.
  * Понижение времени ожидания между рейдами на 20%
  * Стоимость покупки и активации построек повышена на 20%



* <mark style="color:$primary;">Уровень 2:</mark>
  * Ежедневное повышение очков активности города на 50 ед.
  * Понижение времени ожидания между рейдами на 50%
  * Увеличение требований к развитию Века на 15%
  * Стоимость покупки и активации построек повышена на 20%

</details>

<details>

<summary><mark style="color:$primary;"><strong>Феодализм</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Понижение городского налога на 20%
  * Постройки добывают больше ресурсов на 20%
  * Длительность построек с добычей ресурсов на 30% дольше



* <mark style="color:$primary;">Уровень 2:</mark>
  * Понижение городского налога на 30%
  * Постройки добывают больше ресурсов на 30%
  * Постройки добывают больше ресурсов на 1% от каждого жителя в игре
  * Длительность построек с добычей ресурсов на 60% дольше

</details>

<details>

<summary><mark style="color:$primary;"><strong>Тирания</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Понижение времени ожидания между рейдами на 30%
  * Рейды и завоевания не влияют на очки активности
  * Увеличение требований к развитию Века на 25%



* <mark style="color:$primary;">Уровень 2:</mark>
  * Понижение времени ожидания между рейдами на 80%
  * Рейды и завоевания не влияют на очки активности
  * Враги получают дополнительные негативные эффекты на территории города
  * Увеличение требований к развитию Века на 60%

</details>



## Религии

Городские религии дают жителям города различные эффекты

Уровень религий так же можно повышать. Для прокачки потребуется делать пожертвования.

{% hint style="info" %}
<mark style="color:$primary;">**Пожертвования**</mark> - ресурсы игрока, которые он должен вносить для получения различных бонусов, в зависимости от каждой религии.

Религия повышает свой уровень по достижению определённого количества пожертвований
{% endhint %}

<figure><img src="../../.gitbook/assets/image (151).png" alt=""><figcaption></figcaption></figure>

По команде <mark style="color:$primary;">/t religion</mark>, глава города должен выбрать религию, по которой пойдёт его город. После выбора религии, каждый житель города может по этой же команде получать бонусы и совершать пожертвования

{% hint style="danger" %}
Религию нельзя сменить! Ваш выбор окончательный!
{% endhint %}

<details>

<summary><mark style="color:$primary;"><strong>Православие</strong></mark></summary>

*   <mark style="color:$primary;">Уровень 1:</mark>

    * Эффект "Огнестойкость" внутри города
    * +4 ХП
    * -10% к получаемым Екойнам
    * 1% шанс потери трети прочности предмета


* <mark style="color:$primary;">Уровень 2:</mark>
  * Эффект "Огнестойкость" внутри города
  * +8 ХП
  * +20% к получаемому опыту
  * -15% к получаемым Екойнам
  * 3% шанс потери трети  прочности предмета

</details>

<details>

<summary><mark style="color:$primary;"><strong>Католицизм</strong></mark></summary>

*   <mark style="color:$primary;">Уровень 1:</mark>

    * +10% к получаемому опыту
    * -5% стоимости починки предмета
    * 1% шанс получить дополнительный дроп с добычи ресурсов и мобов
    * -10% урон по мобам


* <mark style="color:$primary;">Уровень 2:</mark>
  * +30% к получаемому опыту
  * -15% к стоимости починки предмета
  * 5% шанс получить дополнительный дроп с добычи ресурсов и мобов
  * -30% урон по мобам

</details>

<details>

<summary><mark style="color:$primary;">Исламизм</mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Эффект "Регенерация" внутри города
  * +20% урон по мобам
  * +20% к стоимости починки предмета



* <mark style="color:$primary;">Уровень 2:</mark>
  * Эффект "Регенерация" внутри города
  * Эффект "Насыщение" повсеместно
  * +30% урон по мобам
  * +30% к стоимости починки предмета

</details>

<details>

<summary><mark style="color:$primary;"><strong>Иудаизм</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * +10% к получаемым Екойнам
  * -10% к стоимости починки предмета
  * Урон от падения увеличен в 2 раза



* <mark style="color:$primary;">Уровень 2:</mark>
  * +25% к получаемым Екойнам
  * -30% к стоимости починки предмета
  * Урон от падения увеличен в 2 раза
  * Наносит урон 4 ХП за 50 полученного опыта

</details>

<details>

<summary><mark style="color:$primary;"><strong>Буддизм</strong></mark></summary>

* <mark style="color:$primary;">Уровень 1:</mark>
  * Эффект "Скорость II" внутри города
  * Нет урона от падения
  * 5% шанс не получить предмет при его добыче
  * 1% шанс потери трети прочности предмета



* <mark style="color:$primary;">Уровень 2:</mark>
  * Эффект "Скорость II" повсеместно
  * Нет урона от падения
  * +20% урон по мобам
  * 3% шанс не получить предмет при его добыче
  * 5% шанс потери трети прочности предмета

</details>

## Века

Городской век повышается путём развития, расширения и улучшения города

Чтобы открыть меню и посмотреть текущий век и требования к следующему, пропишите <mark style="color:$primary;">/t century</mark>

<figure><img src="../../.gitbook/assets/image (153).png" alt=""><figcaption></figcaption></figure>

<mark style="color:$primary;">Для прокачки века, город должен достичь одного из требуемых значений:</mark>

* Жители города
* Выполненные квесты
* Заприваченные территории
* Очки активности

{% hint style="info" %}
Прокачка веков усложняет развитие города, но даёт больше возможностей а так же добавляет очки активности!
{% endhint %}

<mark style="color:$primary;">Прокачка века меняет следующие значения:</mark>

* Территориальные претензии
* Лимит альянсов
* Городской налог

{% hint style="info" %}
Когда город достигнет одного из требуемых значений, век повысится автоматически.
{% endhint %}

<details>

<summary><mark style="color:$primary;"><strong>Первобытное общество</strong></mark></summary>

* С этого века начинается развитие Вашего города!

</details>

<details>

<summary><mark style="color:$primary;"><strong>Каменный век</strong></mark></summary>

* Выполненные квесты - 5
* Заприваченные территории - 20
* Жители - 3
* Очки активности - 100

</details>

<details>

<summary><mark style="color:$primary;"><strong>Бронзовый век</strong></mark></summary>

* Выполненные квесты - 25
* Заприваченные территории - 70
* Жители - 7
* Очки активности - 300

</details>

<details>

<summary><mark style="color:$primary;"><strong>Железный век</strong></mark></summary>

* Выполненные квесты - 50
* Заприваченные территории - 150
* Жители - 15
* Очки активности - 700

</details>

<details>

<summary><mark style="color:$primary;"><strong>Средневековье</strong></mark></summary>

* Выполненные квесты - 100
* Заприваченные территории - 300
* Жители - 25
* Очки активности - 1000

</details>

<details>

<summary><mark style="color:$primary;"><strong>Эпоха возрождения</strong></mark></summary>

* Выполненные квесты - 150
* Заприваченные территории - 600
* Жители - 40
* Очки активности - 1500

</details>

<details>

<summary><mark style="color:$primary;"><strong>Новое время</strong></mark></summary>

* Выполненные квесты - 250
* Заприваченные территории - 1000
* Жители - 60
* Очки активности - 3500

</details>

{% hint style="info" %}
Со временем, <mark style="color:$primary;">минимальный век может повышаться</mark>.&#x20;

Новые города будут создаваться с обновлённым веком и стартовыми очками активности.&#x20;

Существующие города так же повысят свой век, активность в том числе повысится
{% endhint %}

***

