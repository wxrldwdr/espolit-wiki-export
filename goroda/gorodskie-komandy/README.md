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

# Городские команды

## Общие городские команды

### Первые шаги

<details>

<summary><mark style="color:$primary;">Как создать город?</mark></summary>

Мы рассмотрели в статье [sozdanie-pervogo-goroda.md](../../glavnaya/pervoe-znakomstvo/sozdanie-pervogo-goroda.md "mention")

</details>

<details>

<summary><mark style="color:$primary;">Как вступить в город?</mark></summary>

Мы рассмотрели в статье [vstuplenie-v-gorod.md](../../glavnaya/pervoe-znakomstvo/vstuplenie-v-gorod.md "mention")

</details>

### Информация о городе

<details>

<summary><mark style="color:$primary;">/town</mark> - Выводит информацию о своём городe</summary>

Выводит информацию:

* Мэр города
* Наличие нации
* Объявление
* Количество жителей и лимиты
* Территории и лимиты
* Рейтинг
* Военные очки

И так же меню быстрого доступа:

* Меню города
* Меню разрешений города
* Настройки города
* Освоение
* Постройки
* Квесты
* Городской инвентарь
* Городской налог



<figure><img src="../../.gitbook/assets/image (108).png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;">/town &#x3C;Название города></mark> - Информация о другом городе</summary>

Выводит информацию:

* Объявление города
* Мэр города
* Количество жителей
* Территории
* Рейтинг
* Возможность напрямую подать заявку в этот город



<figure><img src="../../.gitbook/assets/image (124).png" alt=""><figcaption></figcaption></figure>

</details>

### Путешествия

<details>

<summary><mark style="color:$primary;">/t spawn</mark> - Телепортироваться в свой город</summary>

Перед телепортом необходимо не двигаться в течение 5 секунд!

</details>

<details>

<summary><mark style="color:$primary;">/t spawn &#x3C;Название города></mark> - Телепортироваться в указанный город</summary>

Телепорт возможен только в открытые города! Чтобы открыть город, игрок высокой должности в городе должен прописать команду <mark style="color:$primary;">/t toggle public</mark>

</details>

<details>

<summary><mark style="color:$primary;">/t outpost &#x3C;Номер аутпоста></mark> - Телепортироваться на установленный городом Аутпост</summary>

Работает только, если у города есть заприваченные <mark style="color:$primary;">Аутпосты</mark>.&#x20;

</details>

***

## Команды главы города

### Как пригласить или выгнать игрока

<details>

<summary><mark style="color:$primary;">/t add &#x3C;Ник игрока></mark> - Пригласить игрока в город</summary>

Команда отправляет заявку игроку на вступление в город.&#x20;

<figure><img src="../../.gitbook/assets/image (199).png" alt=""><figcaption></figcaption></figure>

{% hint style="info" %}
Если игрок - [<mark style="color:$primary;">враг города</mark>](../vneshnyaya-politika.md#vragi), он не сможет вступить!
{% endhint %}

</details>

<details>

<summary><mark style="color:$primary;">/t welcome</mark> - Массовый набор игроков в город</summary>

Все игроки, которые не состоят в городе получат уведомления о наборе.&#x20;

<figure><img src="../../.gitbook/assets/image (200).png" alt=""><figcaption></figcaption></figure>

Чтобы повысить эффективность набора, введите команду <mark style="color:$primary;">/t toggle open</mark> для включения свободного вступления в город. Так же, Ваш город появится в списке в меню [<mark style="color:$primary;">Проводника на центральном спавне</mark>](../../glavnaya/pervoe-znakomstvo/#provodnik)

</details>

<details>

<summary><mark style="color:$primary;">/t kick &#x3C;Ник игрока></mark> - Выгнать игрока из города</summary>

{% hint style="danger" %}
Если у Вас открытый город, игрок сможет присоединиться заново! После кика игрока почистите все доверенности, так как, при выходе из города, он их не теряет!

Если этот игрок у Вас в друзьях, он так же имеет полный контроль над Вашими личными участками
{% endhint %}

</details>

***

#### Городской спавн:

<details>

<summary><mark style="color:$primary;">/t set homeblock</mark> - Установить домашний чанк города</summary>

Если Вы меняете местоположение городского спавна, необходимо прописать эту команду первой, а уже после <mark style="color:$primary;">/t set spawn</mark>. Точка спавна должна быть исключительно в домашнем чанке!

<figure><img src="../../.gitbook/assets/image (227).png" alt=""><figcaption></figcaption></figure>

{% hint style="warning" %}
Поменять домашний участок можно 1 раз в 4 часа!
{% endhint %}

</details>

<details>

<summary><mark style="color:$primary;">/t set spawn</mark> - Установить точку спавна</summary>

Точка спавна должна находиться на Домашнем участке, поэтому в первую очередь, необходимо выполнить <mark style="color:$primary;">/t set homeblock</mark> в чанке, на котором вы стоите!

<figure><img src="../../.gitbook/assets/image (237).png" alt=""><figcaption></figcaption></figure>

</details>

***

### Доверенности

<details>

<summary><mark style="color:$primary;">/t trust add &#x3C;Ник игрока></mark> - Выдать доверенность игроку</summary>

Прописывая эту команду, вы даёте полные права в городе указанному игроку. Это означает, что игрок получает все городские права, которые могут быть выше, чем у Ваших жителей.&#x20;

<figure><img src="../../.gitbook/assets/image (238).png" alt=""><figcaption></figcaption></figure>

{% hint style="warning" %}
Используйте эту команду осторожно!
{% endhint %}

</details>

<details>

<summary><mark style="color:$primary;">/t trust remove &#x3C;Ник игрока></mark> - Изъять доверенность у игрока</summary>

<figure><img src="../../.gitbook/assets/image (239).png" alt=""><figcaption></figcaption></figure>

После ввода этой команды, игрок теряет доступ к взаимодействию с городом

</details>

<details>

<summary><mark style="color:$primary;">/t trust list</mark> - Открыть лист доверенных</summary>

Открывает лист, где будут показаны все доверенности, что руководство города выдало другим игрокам

<figure><img src="../../.gitbook/assets/image (240).png" alt=""><figcaption></figcaption></figure>

</details>

<details>

<summary><mark style="color:$primary;">/t trusttown add &#x3C;Название города></mark> - Выдать доверенность городу</summary>

Прописывая эту команду, вы даёте полные права в своём городе каждому жителю указанного города.&#x20;

{% hint style="warning" %}
Используйте эту команду осторожно!
{% endhint %}

</details>

<details>

<summary><mark style="color:$primary;">/t trusttown remove &#x3C;Название города></mark> - Изъять доверенность у города</summary>

После ввода этой команды, все игроки указанного города теряет доступ к взаимодействию с вашим городом

</details>

<details>

<summary><mark style="color:$primary;">/t trusttown list</mark> - Открыть лист доверенных городов</summary>

Открывает лист, где будут показаны все доверенности, что руководство города выдало другим городам

</details>

***

### Управление городом

<details>

<summary><mark style="color:$primary;">/t delete</mark> - Удалить город</summary>

При удалении города, так же удалится весь его прогресс, приваты, альянсы, нация (если город является столицей)

</details>

<details>

<summary><mark style="color:$primary;">/t say &#x3C;Сообщение></mark> - Сказать объявление от лица города</summary>

<figure><img src="../../.gitbook/assets/image (242).png" alt=""><figcaption></figcaption></figure>

Введённое сообщение покажется другим игрокам анонимно, от лица города.&#x20;

</details>

<details>

<summary><mark style="color:$primary;">/t set board &#x3C;Сообщение></mark> - Выложить объявление на доску</summary>

Объявление на доске Board хранится в <mark style="color:$primary;">/town</mark>&#x20;

<figure><img src="../../.gitbook/assets/image (228).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../.gitbook/assets/image (230).png" alt=""><figcaption></figcaption></figure>

Так же, при входе в игру, житель города получает его каждый раз, когда входит в игру

</details>

<details>

<summary><mark style="color:$primary;">/t set mayor &#x3C;Ник игрока></mark> - Сменить мэра города</summary>

После ввода команды необходимо будет подтверждение.&#x20;

Обратите внимание, бывший мэр города, после смены власти, <mark style="color:$primary;">будет иметь роль и привилегии заместителя!</mark>

</details>

<details>

<summary><mark style="color:$primary;">/t rename</mark> - Изменить название города</summary>

Для смены названия города требуются ресурсы в <mark style="color:$primary;">/t inv</mark>:

<figure><img src="../../.gitbook/assets/image (243).png" alt=""><figcaption></figcaption></figure>

А так же смена города изымет из города 500 рейтинга. Если у города нет такого количества рейтинга, он просто упадёт до 0.

</details>

<details>

<summary><mark style="color:$primary;">/t toggle &#x3C;Параметр></mark> - Переключение различных параметров в городе</summary>



* <mark style="color:$primary;">explosion</mark> - Вкл/Выкл взрывы в городе
* <mark style="color:$primary;">fire</mark> - Вкл/Выкл распространение огня в городе
* <mark style="color:$primary;">mobs</mark> - Вкл/Выкл спавн  мобов в городе
* <mark style="color:$primary;">public</mark> - Вкл/Выкл взрывы в городе
* <mark style="color:$primary;">pvp</mark> - Статус города Публичный/Не публичный.&#x20;
  * Публичный статус города позволит всем игрокам телепортироваться в ваш город.
* <mark style="color:$primary;">open</mark> - Статус города Открытый/Закрытый.&#x20;
  * Открытый статус города позволит всем игрокам вступать в Ваш город без заявок.

</details>

***

### Городское меню

<details>

<summary><mark style="color:$primary;">/t menu</mark> - Открыть городское меню</summary>

После того, как открыли меню, у нас появляется меню управления городом

<figure><img src="../../.gitbook/assets/image (136).png" alt=""><figcaption></figcaption></figure>

#### Управление участниками города

<figure><img src="../../.gitbook/assets/image (137).png" alt=""><figcaption></figcaption></figure>

При клике на участника можно:

* Выгнать игрока
* Изменить городскую роль игроку
* Сделать игрока главой города

#### Переключение городских настроек

<figure><img src="../../.gitbook/assets/image (138).png" alt=""><figcaption></figcaption></figure>

В нём можно переключать следующие настройки:

* Распространение огня
* Спавн монстров
* Взрывы
* PVP
* Публичный статус города
* Открытый статус города

#### Права доступа

<figure><img src="../../.gitbook/assets/image (139).png" alt=""><figcaption></figcaption></figure>

Права доступа -  право на какое то взаимодействие для определённых людей

* Переключение - управление механизмами/дверями/сундуками
* Использование предметов
* Ломать
* Строить

В колонке по центру можно выбрать, включить или выключить это право для определённых слоёв:

* Жители
* Нация
* Альянсы
* Посторонние

В правой колонке можно выбрать, включить или выключить все права для всех слоёв

{% hint style="danger" %}
Используйте с осторожностью!
{% endhint %}

#### Пригласить в город

<figure><img src="../../.gitbook/assets/image (140).png" alt=""><figcaption></figcaption></figure>

На данной панели появятся все игроки, которые не состоят в городах. По клику на каждого, можно отправить приглашение в город

</details>



