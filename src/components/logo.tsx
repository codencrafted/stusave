import React from 'react';

export function StuSaveLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="StuSave Logo">
        <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
            aria-hidden="true"
        >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-8.75h2.5c.69 0 1.25-.56 1.25-1.25S14.19 8 13.5 8h-1.25v-.75c0-.41-.34-.75-.75-.75s-.75.34-.75.75v.75H9.5c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25H11v1.5H9.5c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25h1.25v.75c0 .41.34.75.75.75s.75-.34.75-.75v-.75h1.25c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25H13v-1.5h1.5c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25H11v1.5z" fill="currentColor"/>
        </svg>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary dark:text-primary">
            StuSave
        </h1>
    </div>
  );
}
