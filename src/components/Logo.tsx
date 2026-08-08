import { Link } from "react-router";

type LogoProps = {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function Logo({ showTagline = false, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: { box: "w-8 h-8", icon: "w-4 h-4", text: "text-base", tagline: "text-[10px]" },
    md: { box: "w-10 h-10", icon: "w-5 h-5", text: "text-xl", tagline: "text-xs" },
    lg: { box: "w-14 h-14", icon: "w-7 h-7", text: "text-3xl", tagline: "text-sm" },
  };

  const s = sizeClasses[size];

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div
        className={`${s.box} rounded-xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={s.icon}
        >
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`${s.text} font-heading font-bold text-foreground group-hover:text-primary transition-colors leading-tight`}>
          TripMate
        </span>
        {showTagline && (
          <span className={`${s.tagline} text-gray-400 font-sans font-normal -mt-0.5`}>
            AI Travel Planner
          </span>
        )}
      </div>
    </Link>
  );
}