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

# Территория

## Приват территории

<details>

<summary><mark style="color:$primary;">/t claim - Заприватить территорию</mark></summary>

Чтобы заприватить территорию, необходимо встать на свободный участок, и прописать <mark style="color:$primary;">/t claim</mark>

Требуемые ресурсы для привата участка:

<figure><img src="../../../.gitbook/assets/image (201).png" alt=""><figcaption></figcaption></figure>

Участок должен при этом прилегать к основной территории города

Так же, участки ограничены. Чем больше участников у Вас в городе, тем больше участков будет доступно в городе.&#x20;

[<mark style="color:$primary;">Как повысить количество доступных участков?</mark>](../razvitie-goroda.md#territorii)

</details>

<details>

<summary><mark style="color:$primary;">/t unclaim - Снять приват территории</mark></summary>

Расприватить территорию можно командой <mark style="color:$primary;">/unclaim</mark>

Обращаем внимание, что всё содержимое этого участка станет доступным каждому игроку, в том числе все постройки и сундуки!

</details>

***



## Настройки участка

<details>

<summary><mark style="color:$primary;">/plot toggle &#x3C;Параметр> - Выбирает тип участка</mark></summary>

Переключает параметр в участке, на котором вы стоите.

Доступные параметры:

* <mark style="color:$primary;">fire</mark> - Включает распространение огня
* <mark style="color:$primary;">pvp</mark> - Делает доступным PVP на данном участке
* <mark style="color:$primary;">explosion</mark> - Включает возможность взрывов в участке
* <mark style="color:$primary;">mob</mark> - Включает возможность спавна мобов в участке

</details>

<details>

<summary><mark style="color:$primary;">/plot set perm &#x3C;Право> - Настройка городских прав участка</mark></summary>

В правах можно выбрать

* <mark style="color:$primary;">destroy</mark> - Право ломать блоки
* <mark style="color:$primary;">build</mark> - Право строить
* <mark style="color:$primary;">itemuse</mark> - Право использовать предметы
* <mark style="color:$primary;">switch</mark> - Право переключать
* <mark style="color:$primary;">on</mark> - Включить все права
* <mark style="color:$primary;">off</mark> - Выключить все права

А если нужно выбрать определённый слой (жители/все/нация), нужно выбрать:

* <mark style="color:$primary;">resident</mark> - Жители города
* <mark style="color:$primary;">nation</mark> - Нация (Все игроки из всех городов в одной нации)
* <mark style="color:$primary;">ally</mark> - Альянсы (Все игроки из всех городов альянса)
* <mark style="color:$primary;">friend</mark> - Друзья
* <mark style="color:$primary;">outsider</mark> - Все игроки

А после выбрать одно из прав выше

Для ввода команды необходимо встать на участок, к которому хотите дать доступ

</details>

<details>

<summary><mark style="color:$primary;">/plot perm add &#x3C;Ник игрока> - Выдаёт управляемые права на участке</mark></summary>

В отличие от [<mark style="color:$primary;">Доверенностей</mark>](./#doverennosti) - это более детальная настройка прав.&#x20;

После ввода команды, игрок появится в меню в /plot perm gui, где можно выдать только нужные права

Для ввода команды необходимо встать на участок, к которому хотите дать доступ

</details>

<details>

<summary><mark style="color:$primary;">/plot perm gui - Открыть меню управления группой участка</mark></summary>

После ввода команд <mark style="color:$primary;">/plot perm add</mark>, этот игрок попадёт в меню управления. В ней вы можете более детально настроить все допустимые права группы. Для ввода команды необходимо встать на участок в группе.

<figure><img src="../../../.gitbook/assets/image (143).png" alt=""><figcaption></figcaption></figure>

В интерфейсе можно переключить права:

* Ломать
* Использовать предмет
* Переключать
* Строить

И можно удалить этого игрока. После изменений, не забудьте сохранить!

</details>

***

## Группы участков

<details>

<summary><mark style="color:$primary;">/plot group add &#x3C;Название группы> - Создание группы участков</mark></summary>

В первую созданную группу попадёт именно тот участок, на котором вы стоите. Этот участок должен быть запривачен городом

</details>

<details>

<summary><mark style="color:$primary;">/plot group remove - Удаление одного участка из группы</mark></summary>

При этом, участок останется частью города, просто удалится его группа. Для ввода команды требуется чтобы участок был частью города, и нужно находиться на этом участке.

</details>

<details>

<summary><mark style="color:$primary;">/plot group delete - Удаление группы участков</mark></summary>

Все участки останутся частью города, удалится только их группа. Для ввода команды требуется чтобы участок был частью города, и нужно находиться на этом участке, группу которого хотите удалить.

</details>

<details>

<summary><mark style="color:$primary;">/plot group rename - Переименовать группу чанков</mark></summary>

Для ввода команды нужно встать на участок города, группу которого хотите переименовать

</details>

#### Права доступа

<details>

<summary><mark style="color:$primary;">/plot group set perm &#x3C;Право> - Настройка городских прав группы участков</mark></summary>

В правах можно выбрать

* <mark style="color:$primary;">destroy</mark> - Право ломать блоки
* <mark style="color:$primary;">build</mark> - Право строить
* <mark style="color:$primary;">itemuse</mark> - Право использовать предметы
* <mark style="color:$primary;">switch</mark> - Право переключать
* <mark style="color:$primary;">on</mark> - Включить все права
* <mark style="color:$primary;">off</mark> - Выключить все права

А если нужно выбрать определённый слой (жители/все/нация), нужно выбрать:

* <mark style="color:$primary;">resident</mark> - Жители города
* <mark style="color:$primary;">nation</mark> - Нация (Все игроки из всех городов в одной нации)
* <mark style="color:$primary;">ally</mark> - Альянсы (Все игроки из всех городов альянса)
* <mark style="color:$primary;">friend</mark> - Друзья
* <mark style="color:$primary;">outsider</mark> - Все игроки

А после выбрать одно из прав выше

Для ввода команды необходимо встать на участок, к которому хотите дать доступ

</details>

<details>

<summary><mark style="color:$primary;">/plot group perm &#x3C;Ник игрока> -  Выдаёт управляемые права на группе участков</mark></summary>

В отличие от [<mark style="color:$primary;">Доверенностей</mark>](./#doverennosti) - это более детальная настройка прав.&#x20;

После ввода команды, игрок появится в меню в <mark style="color:$primary;">/plot group perm gui</mark>, где можно выдать только нужные права

Для ввода команды необходимо встать на участок, к которому хотите дать доступ

</details>

<details>

<summary><mark style="color:$primary;">/plot group perm remove &#x3C;Имя игрока> - Изъять все права на группу участков у определённого игрока</mark></summary>

Для ввода команды необходимо встать на участок, к группе которого хотите изъять доступ

</details>

<details>

<summary><mark style="color:$primary;">/plot group perm gui - Открыть меню управления группой участка</mark></summary>

После ввода команд <mark style="color:$primary;">/plot group perm add</mark>, этот игрок попадёт в меню управления. В ней вы можете более детально настроить все допустимые права группы. Для ввода команды необходимо встать на участок в группе.

<figure><img src="../../../.gitbook/assets/image (143).png" alt=""><figcaption></figcaption></figure>

В интерфейсе можно переключить права:

* Ломать
* Использовать предмет
* Переключать
* Строить

И можно удалить этого игрока. После изменений, не забудьте сохранить!

</details>

***

## Право на землю

<details>

<summary><mark style="color:$primary;">/plot fs &#x3C;игрок> - Передать право на участок игроку</mark></summary>

Чтобы передать участок игроку, нужно <mark style="color:$primary;">обоим игрокам</mark> встать на выбранный заприваченный участок и прописать команду <mark style="color:$primary;">/plot fs <игрок></mark>

</details>

<details>

<summary><mark style="color:$primary;">/plot group fs - Передать право на группу участков игроку</mark></summary>

Чтобы передать группу участков игроку, нужно <mark style="color:$primary;">обоим игрокам</mark> встать на выбранный заприваченный участок с группой и прописать команду <mark style="color:$primary;">/plot group fs <игрок></mark>

</details>

#### Домашний спавн

<details>

<summary><mark style="color:$primary;">/plot home set -  Устанавливает личную точку возрождения в пределах ваших земель</mark></summary>

Именно в этой точке вы сможете возродиться после смерти или по команде <mark style="color:$primary;">/t spawn</mark>

Чтобы изменить точку, пропишите эту команду в другом месте.

</details>

<details>

<summary><mark style="color:$primary;">/plot home remove - Удаляет личную точку возрождения</mark></summary>

После ввода команды, Вы снова будете возрождаться и телепортироваться на спавн вашего города!

</details>

***

## Доверенности&#x20;

<details>

<summary><mark style="color:$primary;">/plot trust &#x3C;Ник игрока> - Дать доверенность игроку на выбранный участок</mark></summary>

Для ввода команды, необходимо встать на нужный участок

Обратите внимание, команда выдаст абсолютно все права на этот участок игроку.&#x20;

Игрок сможет как строить, так и ломать всё на этом участке!

</details>

<details>

<summary><mark style="color:$primary;">/plot untrust &#x3C;Ник игрока> - Изъять доверенность у игрока на выбранном участке</mark></summary>

Для ввода команды, необходимо встать на нужный участок

После завершения команды, игрок больше не будет иметь доступ к этому участку

</details>

<details>

<summary><mark style="color:$primary;">/plot group trust &#x3C;Ник игрока> - Дать доверенность игроку на выбранной группе участков</mark></summary>

Для ввода команды, необходимо встать на один из участков, которые принадлежат той или иной группе

Обратите внимание, команда выдаст абсолютно все права игроку на участки принадлежащие этой группе <mark style="color:$primary;">(в том числе и новые)</mark>.&#x20;

Игрок сможет как строить, так и ломать всё в участках принадлежащие этой группе!

</details>

<details>

<summary><mark style="color:$primary;">/plot group untrust &#x3C;Ник игрока> - Изъять доверенность у игрока на выбранной группе участков</mark></summary>

Для ввода команды, необходимо встать на один из участков, которые принадлежат той или иной группе

После завершения команды, игрок больше не будет иметь доступ к участкам, принадлежащие данной группе.&#x20;

</details>
