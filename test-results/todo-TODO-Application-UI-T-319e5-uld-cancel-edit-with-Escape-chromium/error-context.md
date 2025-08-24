# Page snapshot

```yaml
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
        - button "Удалить" [ref=e14] [cursor=pointer]
    - listitem [ref=e15]:
      - checkbox [ref=e16] [cursor=pointer]
      - generic [ref=e17]: Неизменная задача
      - generic [ref=e18]:
        - button "Изменить" [ref=e19] [cursor=pointer]
        - button "Удалить" [ref=e20] [cursor=pointer]
```