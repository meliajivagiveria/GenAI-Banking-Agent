import React from 'react';

interface Props {
  content: string;
}

// A lightweight renderer to handle the specific formatting of the prompt output
// Handles **bold**, headers, and newlines without external libraries for strict compliance
const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {lines.map((line, idx) => {
        // Handle Header 3
        if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-lg font-bold text-bank-800 mt-4 mb-2">{line.replace('### ', '')}</h3>
        }
        
        // Handle Header 4
        if (line.startsWith('#### ')) {
            return <h4 key={idx} className="text-md font-bold text-bank-700 mt-3 mb-1">{line.replace('#### ', '')}</h4>
        }

        // Handle Bullet points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
           const text = line.trim().substring(2);
           return (
             <div key={idx} className="flex gap-2 ml-4">
               <span className="text-slate-400">•</span>
               <span>{renderBold(text)}</span>
             </div>
           )
        }
        
         // Handle numbered lists (simple detection)
        if (/^\d+\.\s/.test(line.trim())) {
             const [num, ...rest] = line.trim().split('.');
             const text = rest.join('.').trim();
             return (
               <div key={idx} className="flex gap-2 ml-4">
                 <span className="font-mono text-slate-500 text-xs mt-1">{num}.</span>
                 <span>{renderBold(text)}</span>
               </div>
             )
        }

        // Standard paragraph (ignore empty lines unless they are separators)
        if (line.trim() === '') return <div key={idx} className="h-1"></div>;

        return <div key={idx}>{renderBold(line)}</div>;
      })}
    </div>
  );
};

// Helper to render **bold** text
const renderBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default MarkdownRenderer;