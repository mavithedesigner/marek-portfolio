# Photos for client quotes

Drop a photo here (png / jpg / webp), then point the matching entry in
`src/data/testimonials.json` at the filename:

```json
{ "name": "Dávid Drímal", "avatar": "david-drimal.jpg" }
```

Square images work best; they are cropped to a circle at 56 px.
Without a photo the card falls back to the person's initials, so a missing
file never breaks the layout.
