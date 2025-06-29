# 1. Determine the base image.
FROM node:lts-alpine AS base

# 2. Set up the working directory
WORKDIR /app

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock turbo.json ./
COPY apps/agents/package.json ./apps/agents/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/evals/package.json ./packages/evals/

# Copy the rest of the application code
COPY . .

# 3. Install dependencies
RUN yarn install --frozen-lockfile

# 4. Build the application
# Using a separate build stage for cleaner final image
FROM base AS builder
WORKDIR /app
COPY --from=base /app /app
RUN yarn build

# 5. Set runtime environment variables
# These are from the .env.example files
# Secrets should be passed in at runtime, not baked into the image
ENV LANGCHAIN_TRACING_V2="true"
ENV LANGCHAIN_API_KEY=""
ENV ANTHROPIC_API_KEY=""
ENV OPENAI_API_KEY=""
ENV _AZURE_OPENAI_API_KEY=""
ENV _AZURE_OPENAI_API_DEPLOYMENT_NAME=""
ENV _AZURE_OPENAI_API_VERSION=""
ENV _AZURE_OPENAI_API_BASE_PATH=""
ENV FIREWORKS_API_KEY=""
ENV GOOGLE_API_KEY=""
ENV GROQ_API_KEY=""
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV SUPABASE_SERVICE_ROLE=""
ENV FIRECRAWL_API_KEY=""

ENV NEXT_PUBLIC_FIREWORKS_ENABLED="true"
ENV NEXT_PUBLIC_GEMINI_ENABLED="true"
ENV NEXT_PUBLIC_ANTHROPIC_ENABLED="true"
ENV NEXT_PUBLIC_OPENAI_ENABLED="true"
ENV NEXT_PUBLIC_AZURE_ENABLED="false"
ENV NEXT_PUBLIC_OLLAMA_ENABLED="false"
ENV NEXT_PUBLIC_GROQ_ENABLED="false"
ENV OLLAMA_API_URL="http://host.docker.internal:11434"
# Note: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are duplicated
# but listed again for clarity from apps/web/.env.example
ENV NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS=""
# Note: GROQ_API_KEY is duplicated
# Note: FIRECRAWL_API_KEY is duplicated
# Azure specific vars from apps/web/.env.example, ensure they are prefixed with an underscore
# ENV _AZURE_OPENAI_API_KEY="" # Already listed
ENV _AZURE_OPENAI_API_INSTANCE_NAME=""
# ENV _AZURE_OPENAI_API_DEPLOYMENT_NAME="" # Already listed
# ENV _AZURE_OPENAI_API_VERSION="" # Already listed
# ENV _AZURE_OPENAI_API_BASE_PATH="" # Already listed

# Application specific variables
ENV NODE_ENV="production"
ENV PORT="3000"

# Final stage for running the application
FROM base AS runner
WORKDIR /app

COPY --from=builder /app/apps/web/.next /app/apps/web/.next
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/web/package.json /app/apps/web/package.json
COPY --from=builder /app/apps/web/public /app/apps/web/public
# Copy other necessary files from the workspace if they are directly used by the web app at runtime
# For example, if the web app reads from packages/shared directly at runtime (not just build time)
# COPY --from=builder /app/packages/shared /app/packages/shared
# COPY --from=builder /app/apps/agents/dist /app/apps/agents/dist # If agents are run separately or invoked by web

# Copy the main package.json and yarn.lock for the start command context
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/yarn.lock /app/yarn.lock

# 6. Expose the application port
EXPOSE 3000

# 7. Define the startup command
# Ensure the command is run in the context of the web app
CMD ["yarn", "workspace", "@opencanvas/web", "start"]
