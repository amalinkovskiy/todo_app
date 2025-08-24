# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - heading "TODO List" [level=1] [ref=e3]
    - generic [ref=e4]:
      - textbox "Введите новую задачу..." [ref=e5]
      - button "Добавить" [ref=e6] [cursor=pointer]
    - list [ref=e8]:
      - listitem [ref=e9]:
        - checkbox [ref=e10] [cursor=pointer]
        - generic [ref=e11]: Оригинальная задача
        - generic [ref=e12]:
          - button "Изменить" [ref=e13] [cursor=pointer]
          - button "Удалить" [active] [ref=e14] [cursor=pointer]
      - listitem [ref=e15]:
        - checkbox [ref=e16] [cursor=pointer]
        - generic [ref=e17]: Задача для удаления
        - generic [ref=e18]:
          - button "Изменить" [ref=e19] [cursor=pointer]
          - button "Удалить" [ref=e20] [cursor=pointer]
  - generic [ref=e22]:
    - heading "Подтверждение удаления" [level=3] [ref=e23]
    - paragraph [ref=e24]: Вы уверены, что хотите удалить эту задачу?
    - generic [ref=e25]: Оригинальная задача
    - generic [ref=e26]:
      - button "Удалить" [ref=e27] [cursor=pointer]
      - button "Отмена" [ref=e28] [cursor=pointer]
```