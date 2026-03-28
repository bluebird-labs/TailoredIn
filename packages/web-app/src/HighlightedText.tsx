import React from 'react';

export type HighlightedTextProps = {
  text: string;
  highlight: string[];
  lowlight?: string[];
}

export const HighlightedText = (props: HighlightedTextProps) => {
  const { text, highlight, lowlight = [] } = props;

  const terms = highlight.concat(lowlight).join('|');
  const parts = text.split(new RegExp(`\\b(${terms})\\b`, 'gi'));

  const getPartStyle = (part: string) => {
    part = part.toLowerCase();
    if (highlight.includes(part)) {
      return {
        backgroundColor: '#008B02',
        color: 'whitesmoke',
        fontWeight: 'bold'
      };
    } else if (lowlight.includes(part)) {
      return {
        backgroundColor: '#F44336',
        textDecoration: 'strike'
      };
    } else {
      return {};
    }
  };

  return <p> {parts.map((part, i) =>
    <span key={i} style={getPartStyle(part)}>
            {part}
        </span>)
  } </p>;
};
