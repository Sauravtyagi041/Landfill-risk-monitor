# LandRisk — Landfill Environmental Risk Monitor

LandRisk is a map-based dashboard for exploring modeled exposure risk around major landfill sites in India. It combines a user's location, landfill distance, ambient air-quality readings, and wind direction to estimate a proximity risk score.

**Project:** [Landfill Risk Monitor on GitHub](https://github.com/Sauravtyagi041/Landfill-risk-monitor)

**Live prototype:** [Open the LandRisk dashboard](https://landfill-risk-monitor.vercel.app/)

> **Note:** LandRisk is a demonstration and decision-support prototype. Its modeled scores are not medical advice, regulatory measurements, or a substitute for official environmental monitoring.

## Features

- Interactive map with 10 seeded landfill locations across Delhi, Mumbai, Ahmedabad, Hyderabad, Chennai, Bengaluru, and Pune.
- Set the analysis location using browser geolocation, map clicks, or a landfill/city search.
- View the nearest landfill, distance, AQI, pollutant breakdown, wind direction, and risk explanation.
- Estimate risk on a 0–100 scale using AQI, distance decay, and a wind-toward-user factor; label results Low, Medium, High, or Severe.
- Display landfill markers and modeled plume direction on the map.
- AWS serverless backend design with API Gateway, Lambda, DynamoDB, Secrets Manager, and a 15-minute EventBridge refresh.
- Frontend fallback calculation so the dashboard can render without a reachable backend.

## Technology

**Frontend:** React 18, Vite 5, Leaflet, React Leaflet, Lucide React, Tailwind CSS CDN.

**Backend/infrastructure:** Python 3.11 AWS Lambda, AWS SAM, API Gateway, DynamoDB, EventBridge, AWS Secrets Manager, WAQI API, and OpenWeather API.

## Run the dashboard locally

Requirements: Node.js and npm.

```bash
git clone https://github.com/Sauravtyagi041/Landfill-risk-monitor.git
cd Landfill-risk-monitor/client
npm install
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) or the local URL printed by Vite (the project config uses port `3000`). This local link only works while the development server is running on your computer. To create a production frontend bundle:

```bash
npm run build
npm run preview
```

Without a working API at `/api/risk`, the dashboard uses its client-side modeled fallback readings. Browser location access requires permission and a secure context (localhost is supported by modern browsers).

## AWS backend

The AWS SAM template is at [`infra/template.yaml`](infra/template.yaml). It defines the risk API (`GET`/`POST /api/risk`), a scheduled environmental cache refresh, two DynamoDB tables, and a Secrets Manager secret for the WAQI and OpenWeather API keys.

To deploy, install and configure the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), then run from the repository root:

```bash
cd infra
sam build --template-file template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

Use an AWS account and region where you are authorized to create the resources. Update the deployed `LandRisk/ApiKeys` secret with valid API keys to enable live AQI and wind feeds. If the external feeds or credentials are unavailable, the refresh function generates modeled fallback readings.

After deployment, SAM outputs the API endpoint. The current Vite configuration does not proxy `/api/risk` to that endpoint, so configure your frontend hosting or a development proxy to route `/api/risk` to the deployed API before expecting the dashboard to use AWS responses. The dashboard falls back to local modeled data when the API is unreachable.

## Repository layout

```text
client/                  React and Vite dashboard
  src/components/        Map, risk card, alerts, and architecture UI
  src/data/              Seed landfill records
  src/utils/             Distance, wind, plume, and risk calculations
data/landfills.json      Backend landfill dataset
infra/template.yaml      AWS SAM infrastructure
infra/src/handlers/      Risk API and scheduled cache refresh
infra/src/utils/         Backend geographic and risk calculations
```

## Risk model

The backend and frontend fallback use the same basic model:

```text
raw risk = AQI × (1 / max(distance_km, 0.3)) × wind factor
score    = clamp((raw risk / 110) × 100, 0, 100)
```

The wind factor is `1.5` when the wind is modeled as blowing toward the user's location and `1.0` otherwise. Labels are Low (<25), Medium (25–<50), High (50–<75), and Severe (≥75). Readings may be modeled when live feeds are not configured or available.

## License

No license file is currently included. Contact the repository owner for reuse and distribution terms.
