import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../utils/cn';

/**
 * ChatMessage component that renders messages with markdown support for AI responses.
 * User messages are rendered as plain text, while AI (sammy) messages support markdown.
 */
const ChatMessage = ({ text, sender }) => {
    const isUser = sender === 'user';

    const bubbleClasses = cn(
        "max-w-[80%] p-3 text-sm leading-relaxed shadow-sm transition-all",
        isUser
            ? "bg-primary text-white rounded-2xl rounded-tr-none dark:bg-sky-600"
            : "bg-surface text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
    );

    // Custom components for markdown rendering with chat-appropriate styling
    const markdownComponents = {
        // Paragraphs - no extra margin for first/last
        p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
        ),
        // Strong/bold text
        strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
        ),
        // Emphasis/italic
        em: ({ children }) => (
            <em className="italic">{children}</em>
        ),
        // Inline code
        code: ({ children, className }) => {
            // Check if this is a code block (has language class) or inline code
            const isCodeBlock = className?.includes('language-');
            if (isCodeBlock) {
                return (
                    <code className={cn(
                        "block bg-slate-100 dark:bg-slate-900 rounded p-2 my-2 text-xs overflow-x-auto",
                        className
                    )}>
                        {children}
                    </code>
                );
            }
            return (
                <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                </code>
            );
        },
        // Code blocks (pre wrapper)
        pre: ({ children }) => (
            <pre className="my-2 first:mt-0 last:mb-0 overflow-x-auto">
                {children}
            </pre>
        ),
        // Unordered lists
        ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 last:mb-0 space-y-1">
                {children}
            </ul>
        ),
        // Ordered lists
        ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 last:mb-0 space-y-1">
                {children}
            </ol>
        ),
        // List items
        li: ({ children }) => (
            <li className="text-sm">{children}</li>
        ),
        // Links
        a: ({ href, children }) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 underline hover:no-underline"
            >
                {children}
            </a>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-3 my-2 italic text-slate-600 dark:text-slate-400">
                {children}
            </blockquote>
        ),
        // Headings - scaled down for chat context
        h1: ({ children }) => (
            <h1 className="text-base font-bold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="text-base font-semibold mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-1">{children}</h3>
        ),
        // Horizontal rule
        hr: () => (
            <hr className="my-2 border-slate-200 dark:border-slate-700" />
        ),
    };

    return (
        <div className={cn("flex mb-4 animate-slideUp", isUser ? "justify-end" : "justify-start")}>
            <div className={bubbleClasses}>
                {isUser ? (
                    // User messages: plain text
                    text
                ) : (
                    // AI messages: render markdown
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {text}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
