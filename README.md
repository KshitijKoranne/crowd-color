# 🎨 CrowdColor

**Collaborative Pixel Art - One Pixel at a Time**

CrowdColor is a real-time collaborative web application where users upload images that become grayscale canvases for community coloring. Each visitor can place one pixel every 6 hours, creating beautiful collaborative artwork together.

![CrowdColor Demo](https://via.placeholder.com/800x400/6366f1/ffffff?text=CrowdColor+Demo)

## ✨ Features

- 📤 **Upload Images**: Upload any JPG/PNG image (max 10MB)
- 🎨 **Auto Grayscale**: Images are automatically converted to grayscale and resized to max 400×400px
- 🖱️ **Interactive Canvas**: Click pixels to select and color them
- 🎨 **20 Vibrant Colors**: Choose from a curated color palette
- ⏱️ **6-Hour Cooldown**: Each user can place one pixel every 6 hours
- ⚡ **Real-time Updates**: See other users' pixels appear instantly
- 📊 **Progress Tracking**: Monitor completion percentage and colored pixel count
- 💾 **Download**: Save the final colored artwork as PNG
- 🔗 **Share**: Share board URLs with friends
- 📱 **Mobile Responsive**: Works beautifully on all devices

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime + Storage)
- **Routing**: React Router v6
- **Image Processing**: HTML5 Canvas API

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great!)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd crowdcolor
npm install
```

### 2. Set Up Supabase

Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:

1. Create a Supabase project
2. Set up database tables (`boards` and `pixels`)
3. Configure storage bucket (`board-images`)
4. Enable Realtime for the `pixels` table
5. Get your API credentials

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase project URL and anon key.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚢 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. Add environment variables in Netlify dashboard

## 🎮 How to Use

### Upload a New Board

1. Click "Upload New Image" on the home page
2. Select an image (JPG/PNG, max 10MB)
3. Enter a title and optional description
4. Click "Create Board"
5. Your image will be processed and converted to grayscale

### Color Pixels

1. Browse the gallery and click on a board
2. Click on any pixel in the canvas to select it
3. Choose a color from the palette
4. Click "Place Pixel"
5. Wait 6 hours before placing another pixel on that board

### Share Your Board

- Click the "Share" button to copy the board URL
- Send it to friends so they can contribute!

### Download Artwork

- Click the "Download" button to save the current state as PNG

## 🏗️ Project Structure

```
crowdcolor/
├── src/
│   ├── components/
│   │   ├── Gallery.tsx       # Home page with board grid
│   │   ├── Upload.tsx         # Image upload form
│   │   └── BoardView.tsx      # Interactive canvas view
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client & types
│   │   ├── imageUtils.ts      # Image processing utilities
│   │   └── cooldown.ts        # Cooldown management
│   ├── App.tsx                # Main app with routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Tailwind imports
├── public/                    # Static assets
├── SUPABASE_SETUP.md         # Supabase setup guide
├── .env.example              # Environment template
└── package.json
```

## 🔧 Configuration

### Adjust Image Size Limit

Edit `src/lib/imageUtils.ts`:

```typescript
export async function processImage(
  file: File,
  maxWidth = 400,  // Change this
  maxHeight = 400  // Change this
)
```

### Adjust Cooldown Duration

Edit `src/lib/cooldown.ts`:

```typescript
const COOLDOWN_HOURS = 6;  // Change this
```

### Customize Color Palette

Edit `src/lib/imageUtils.ts`:

```typescript
export const COLOR_PALETTE = [
  { name: 'Red', hex: '#EF4444' },
  // Add or modify colors here
];
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

- Make sure `.env` file exists and has correct values
- Restart dev server after changing `.env`

### Images not uploading

- Check Supabase Storage bucket is created and public
- Verify storage policies are set correctly

### Real-time not working

- Ensure Realtime is enabled for `pixels` table in Supabase
- Check browser console for connection errors

### Cooldown not persisting

- Cooldown uses localStorage - clearing browser data resets it
- For cross-device cooldown, implement Supabase Auth (future enhancement)

## 🚀 Future Enhancements

- [ ] User authentication (Supabase Auth)
- [ ] User profiles and contribution history
- [ ] Board categories and tags
- [ ] Search and filter boards
- [ ] Comments and reactions
- [ ] Pixel art templates
- [ ] Time-lapse animation of board evolution
- [ ] Leaderboards (most pixels placed)
- [ ] Report inappropriate content
- [ ] Admin moderation tools

## 📄 License

MIT License - feel free to use this project for learning or building your own version!

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## 💡 Credits

Built with ❤️ using:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Coloring! 🎨**
