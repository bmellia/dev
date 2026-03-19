import type { ReactNode } from "react";


type InfoCardProps = {
  title: string;
  description: string;
  body?: ReactNode;
  footer?: ReactNode;
};


export function InfoCard({ title, description, body, footer }: InfoCardProps) {
  return (
    <section className="info-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {body ? <div className="info-card-body">{body}</div> : null}
      {footer ? <div className="info-card-footer">{footer}</div> : null}
    </section>
  );
}
