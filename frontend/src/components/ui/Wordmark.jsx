import { cn } from '../../utils/cn';

const Wordmark = ({ variant = 'full', size = 'md', className }) => {
  const sizes = {
    sm: { img: 'w-8 h-8', text: 'text-xl' },
    md: { img: 'w-16 h-16', text: 'text-3xl' },
    lg: { img: 'w-20 h-20', text: 'text-4xl' }
  };

  const iconBox = (
    <img
      src="/logo.png"
      alt="Sammy"
      className={cn(
        "rounded-lg",
        sizes[size].img
      )}
    />
  );

  const text = (
    <span className={cn(
      "font-black uppercase tracking-wide text-slate-600",
      sizes[size].text
    )}>
      Sammy
    </span>
  );

  if (variant === 'icon') return <div className={className}>{iconBox}</div>;
  if (variant === 'text-only') return <div className={className}>{text}</div>;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {iconBox}
      {text}
    </div>
  );
};

export default Wordmark;
