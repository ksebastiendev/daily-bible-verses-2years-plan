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
    DailyVerseResponse: {
      type: "object",
      properties: {
        date: { type: "string" },
        reference: { type: "string" },
        text: { type: "string" },
        message: { type: "string", nullable: true },
        source: { type: "string", enum: ["database", "fallback"] },
      },
      required: ["date", "reference", "text", "message", "source"],
      additionalProperties: false,
    },
    LeaderboardLeader: {
      type: "object",
      properties: {
        rank: { type: "integer" },
        user_id: { type: "string" },
        username: { type: "string" },
        score: { type: "number" },
        streak: { type: "integer" },
      },
      required: ["rank", "user_id", "username", "score", "streak"],
      additionalProperties: false,
    },
    LeaderboardResponse: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["monthly", "global"] },
        generated_at: { type: "string" },
        leaders: {
          type: "array",
          items: { $ref: "#/components/schemas/LeaderboardLeader" },
        },
      },
      required: ["period", "generated_at", "leaders"],
      additionalProperties: false,
    },
    ProfileResponse: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", nullable: true },
        username: { type: "string" },
        phone: { type: "string" },
        points: { type: "integer" },
        streak: { type: "integer" },
        isEligibleForLeaderboard: { type: "boolean" },
        isEligibleForRewards: { type: "boolean" },
      },
      required: [
        "id",
        "email",
        "username",
        "phone",
        "points",
        "streak",
        "isEligibleForLeaderboard",
        "isEligibleForRewards",
      ],
      additionalProperties: false,
    },
    UpdateProfileRequest: {
      type: "object",
      properties: {
        username: { type: "string" },
        phone: { type: "string" },
      },
      additionalProperties: false,
    },
    RewardWinner: {
      type: "object",
      properties: {
        rank: { type: "integer" },
        user_id: { type: "string" },
        username: { type: "string" },
        phone: { type: "string" },
        score: { type: "number" },
        streak: { type: "integer" },
        reward_eligible: { type: "boolean" },
      },
      required: ["rank", "user_id", "username", "phone", "score", "streak", "reward_eligible"],
      additionalProperties: false,
    },
    RewardWinnersResponse: {
      type: "object",
      properties: {
        month: { type: "string" },
        generated_at: { type: "string" },
        winners: {
          type: "array",
          items: { $ref: "#/components/schemas/RewardWinner" },
        },
      },
      required: ["month", "generated_at", "winners"],
      additionalProperties: false,
    },
    NotificationLogRequest: {
      type: "object",
      properties: {
        type: { type: "string" },
        userId: { type: "string" },
        sentAt: { type: "string" },
        idempotencyKey: { type: "string" },
        meta: { type: "object", additionalProperties: true },
      },
      required: ["type"],
      additionalProperties: false,
    },
    NotificationLogResponse: {
      type: "object",
      properties: {
        id: { type: "string", nullable: true },
        deduplicated: { type: "boolean" },
      },
      required: ["id", "deduplicated"],
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
    "/api/daily-verse": {
      get: {
        summary: "Get daily verse",
        tags: ["DailyVerse"],
        security: [],
        responses: {
          "200": {
            description: "Daily verse payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DailyVerseResponse",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
    "/api/leaderboard": {
      get: {
        summary: "Get leaderboard",
        tags: ["Leaderboard"],
        security: [],
        responses: {
          "200": {
            description: "Leaderboard payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LeaderboardResponse",
                },
              },
            },
          },
          "500": {
            description: "Internal Server Error",
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
    "/api/profile": {
      get: {
        summary: "Get authenticated user profile",
        tags: ["Profile"],
        responses: {
          "200": {
            description: "Profile payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ProfileResponse",
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
          "500": {
            description: "Internal Server Error",
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
      put: {
        summary: "Update authenticated user profile",
        tags: ["Profile"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateProfileRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated profile payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ProfileResponse",
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
          "500": {
            description: "Internal Server Error",
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
    "/api/rewards/winners": {
      get: {
        summary: "Get monthly reward winners",
        tags: ["Rewards"],
        responses: {
          "200": {
            description: "Reward winners payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RewardWinnersResponse",
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
          "500": {
            description: "Internal Server Error",
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
    "/api/notifications/log": {
      post: {
        summary: "Write notification log with MVP idempotency",
        tags: ["Notifications"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NotificationLogRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Notification log created or deduplicated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationLogResponse",
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
          "500": {
            description: "Internal Server Error",
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
