'use client';

import Link from 'next/link';

const PropertyCard = ({ property, showLink = true }) => (
  <div className="p-4 border rounded shadow">
    <h2 className="text-xl font-bold">{property.location}</h2>
    <p>Price: ${property.price}</p>
    <p>Type: {property.property_type}</p>
    <p>Description: {property.description}</p>
    <p>Area: {property.area} sq ft</p>
    <p>Bedrooms: {property.bedrooms}</p>
    <p>Bathrooms: {property.bathrooms}</p>
    {showLink && <Link href={`/properties/${property.id}`} className="text-blue-500">View Details</Link>}
  </div>
);

export default PropertyCard; 