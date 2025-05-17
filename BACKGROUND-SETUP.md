# Background Image Setup

To complete the setup of your wedding photo book background image, please follow these steps:

1. Save the couple image from our conversation to your local drive
2. Rename the image file to `background.png` (or update the path in `src/app/globals.css` if using a different filename)
3. Place the image file in the `public/images/` directory of your project
4. Restart your development server (if it's running) with `npm run dev`

The image will be displayed as a fixed background across all pages of your wedding photo book site.

## Troubleshooting

If you don't see the background image:

- Make sure the image file is correctly placed in the `public/images/` directory
- Check that the image is named `background.png` or update the path in `src/app/globals.css`
- Verify the image is properly formatted (PNG, JPG, etc.)
- Try clearing your browser cache or opening in a private/incognito window

## Customizing the Background Effect

You can adjust the overlay opacity and blend mode in `src/app/globals.css`:

```css
body {
  /* ... */
  background-color: rgba(0, 0, 0, 0.35); /* Adjust the last value (0.35) to control darkness */
  background-blend-mode: multiply; /* Try different modes: darken, multiply, overlay, etc. */
}
``` 