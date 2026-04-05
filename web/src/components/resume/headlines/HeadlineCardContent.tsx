interface HeadlineCardContentProps {
  readonly headline: {
    id: string;
    label: string;
    summaryText: string;
  };
}

function HeadlineCardContent({ headline }: HeadlineCardContentProps) {
  return (
    <div data-slot="headline-card-content">
      <p className="font-medium text-[15px] tracking-[-0.01em]">{headline.label}</p>
      {headline.summaryText && (
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{headline.summaryText}</p>
      )}
    </div>
  );
}

export { HeadlineCardContent };
