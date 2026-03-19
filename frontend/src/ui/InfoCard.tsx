import type { ReactNode } from "react";


type InfoCardProps = {
  title: string;
  description: string;
  footer?: ReactNode;
};


export function InfoCard({ title, description, footer }: InfoCardProps) {
  return (
    <section className="info-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {footer ? <div className="info-card-footer">{footer}</div> : null}
    </section>
  );
}
