# Meet Custom Frontend

custom video conferencing and collaboration frontend built with Next.js 15, LiveKit, and Tailwind CSS. It is designed to provide a seamless and highly interactive online meeting experience with rich collaboration tools.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **WebRTC/Communications**: [LiveKit](https://livekit.io/) (`livekit-client`, `@livekit/components-react`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Icons), [Sonner](https://sonner.emilkowal.ski/) (Toasts)
- **Rich Content & Tools**:
  - [Excalidraw](https://excalidraw.com/) (Whiteboard)
  - [Tiptap](https://tiptap.dev/) (Rich Text Editor)
  - [React PDF Viewer](https://react-pdf-viewer.dev/) (Slide presentation)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:

- Node.js (v20 or higher recommended)
- `npm`, `yarn`, `pnpm`, or `bun`

### Installation

1. Clone the repository and navigate into the project directory.
2. Install the necessary dependencies:

```bash
bun install
# or
npm install
```

### Running the Development Server

Start the application in development mode:

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

To connect to your LiveKit backend and other services, ensure you create a `.env.local` file in the root of the project.

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server-url
# Add any other required environment variables here
```

## Building for Production

To create an optimized production build:

```bash
bun run build
# or
npm run build
```

Then, you can start the production server:

```bash
bun run start
# or
npm run start
```

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
