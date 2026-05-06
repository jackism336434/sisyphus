export default function BrandLogo(): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-90"
      >
        {/* Sisyphus boulder/rock abstract logo */}
        <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.5" fill="none" />
        <path
          d="M24 4 C16 12, 8 20, 24 36 C40 20, 32 12, 24 4Z"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="4" fill="white" opacity="0.8" />
        {/* Right-side slanted line - pushing motion */}
        <line
          x1="34"
          y1="30"
          x2="42"
          y2="20"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Sisyphus
      </h1>
    </div>
  )
}
