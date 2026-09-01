import { type FormDetails } from "./types";
import './Details.css';

type DetailsProps = {
        details: FormDetails;
};

export function Details({ details }: DetailsProps)  {
        return (
                <section className="details">
                        <h1>{details.title}</h1>
                        
                        <div className="details-meta">
                                {details.price && (
                                        <span className="details-meta-price">
                                                {details.price} Sek 
                                        </span>
                                )}

                                {details.size && (
                                        <span className="details-meta-size">
                                                {details.size} m2
                                        </span>
                                )}
                        </div>

                        {details.caption && (
                                <p className="details-caption">
                                        {details.caption}
                                </p>
                        )}
                </section>
        )
}