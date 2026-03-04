"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerClient() {
  return (
    <div className="min-h-150 w-full">
      <SwaggerUI url="/api/docs" docExpansion="list" defaultModelsExpandDepth={-1} />
    </div>
  );
}
