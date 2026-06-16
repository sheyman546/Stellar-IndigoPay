import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  footer,
  className = "",
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`}
    >
      {(title || description) && (
        <div className="flex flex-col space-y-1.5 p-6">
          {title && (
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="p-6 pt-0">{children}</div>
      {footer && <div className="flex items-center p-6 pt-0">{footer}</div>}
    </div>
  );
};

export default Card;
