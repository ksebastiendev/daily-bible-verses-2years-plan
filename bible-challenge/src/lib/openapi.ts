type OpenApiPrimitiveType = "string" | "number" | "integer" | "boolean";

interface OpenApiSchema {
  type?: OpenApiPrimitiveType | "object" | "array";
  format?: string;
  description?: string;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  items?: OpenApiSchema;
  nullable?: boolean;
  example?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean | OpenApiSchema;
  $ref?: string;
}

interface OpenApiMediaType {
  schema: OpenApiSchema;
}

interface OpenApiResponse {
  description: string;
  content?: {
    "application/json": OpenApiMediaType;
  };
}

interface OpenApiRequestBody {
  required?: boolean;
  content: {
    "application/json": OpenApiMediaType;
  };
}

interface OpenApiOperation {
  summary: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
}

interface OpenApiPathItem {
  [method: string]: OpenApiOperation;
}

interface OpenApiSpec {
  openapi: "3.0.3";
  info: {
    title: string;
    version: string;
  };
  servers: Array<{
    url: string;
  }>;
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http";
        scheme: "bearer";
        bearerFormat: "JWT";
      };
    };
    schemas: Record<string, OpenApiSchema>;
  };
  security: Array<Record<string, string[]>>;
  paths: Record<string, OpenApiPathItem>;
}

export function getOpenApiSpec(baseUrl?: string): OpenApiSpec {
  const schemas: Record<string, OpenApiSchema> = {
    ErrorResponse: {
      type: "object",
      properties: {
        error: {
          type: "string",
        },
      },
      required: ["error"],
      additionalProperties: true,
    },
    ChallengeTodayResponse: {
      type: "object",
      properties: {
        plan_id: { type: "string" },
        plan_day_id: { type: "string" },
        day_index: { type: "integer" },
        reference: { type: "string" },
        last_completed_day: { type: "integer", nullable: true },
        start_day_index: { type: "integer" },
        status: { type: "string" },
      },
      required: [
        "plan_id",
        "plan_day_id",
        "day_index",
        "reference",
        "last_completed_day",
        "start_day_index",
        "status",
      ],
      additionalProperties: false,
    },
    CheckinRequest: {
      type: "object",
      properties: {
        planDayId: { type: "string" },
        reflection: { type: "string", nullable: true },
      },
      required: ["planDayId"],
      additionalProperties: false,
    },
    CheckinResponse: {
      type: "object",
      properties: {
        day_index: { type: "integer" },
        points_earned: { type: "number" },
        total_points: { type: "number" },
      },
      required: ["day_index", "points_earned", "total_points"],
      additionalProperties: false,
    },
    StartChallengeRequest: {
      type: "object",
      properties: {
        planId: { type: "string" },
        startDayIndex: { type: "integer", minimum: 1, maximum: 730 },
      },
      required: ["startDayIndex"],
      additionalProperties: false,
    },
    StartChallengeResponse: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        planId: { type: "string" },
        startDayIndex: { type: "integer" },
      },
      required: ["success", "planId", "startDayIndex"],
      additionalProperties: false,
    },
  };

  const paths: Record<string, OpenApiPathItem> = {
    "/api/challenge/today": {
      get: {
        summary: "Get today's challenge",
        tags: ["Challenge"],
        responses: {
          "200": {
            description: "Today's challenge payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ChallengeTodayResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/challenge/checkin": {
      post: {
        summary: "Check in completed day",
        tags: ["Challenge"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CheckinRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Check-in completed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CheckinResponse",
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/challenge/start": {
      post: {
        summary: "Start or update challenge progress",
        tags: ["Challenge"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/StartChallengeRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Challenge started or updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StartChallengeResponse",
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "404": {
            description: "Active plan not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "Bible Challenge API",
      version: "1.0.0",
    },
    servers: [{ url: baseUrl ?? "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas,
    },
    security: [{ bearerAuth: [] }],
    paths,
  };
}
