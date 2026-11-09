// Kursus cloud: konsep dasar, model layanan, sampai deploy ke Cloud Run.
export default {
  slug: 'cloud',
  title: 'Intro to Cloud Computing',
  category: 'technology',
  type: 'Video',
  level: 'Intermediate',
  rating: 4.7,
  author: 'Andi Saputra',
  description: 'What the cloud is, the main service models, and how to deploy a simple app.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'What is cloud computing?',
      type: 'Video',
      minutes: 7,
      videoId: 'M988_fsOSWo',
      videoStart: 0,
      contentMd: `- Compare running your own servers on-premises with renting computing power over the internet and paying only for what you use.
- The video introduces deployment models and service models; each gets its own lesson next.
- Try the short quiz the video asks at 5:03 before moving on.`,
    },
    {
      title: 'IaaS, PaaS and SaaS',
      type: 'Video',
      minutes: 8,
      videoId: '36zducUX16w',
      videoStart: 0,
      contentMd: `- **IaaS**: you rent raw infrastructure such as virtual machines, storage and networks.
- **PaaS**: you bring your code and the platform runs it.
- **SaaS**: you use finished software in the browser.
- For each model, name one product you have already used.`,
    },
    {
      title: 'Deployment models & shared responsibility',
      type: 'Article',
      minutes: 9,
      contentMd: `"The cloud" is not one thing. Where the infrastructure lives, and who manages each layer of it, changes cost, control and security.

## Public, private and hybrid

- **Public cloud**: infrastructure owned and run by a provider such as AWS, Google Cloud or Microsoft Azure, shared by many customers and rented by the second or hour.
- **Private cloud**: cloud-style infrastructure used by one organisation only, in its own data center or hosted by a partner. More control, more cost.
- **Hybrid cloud**: a mix of the two, connected so workloads and data can move between them. A bank might keep customer records on-premises and run its mobile app backend in the public cloud.
- **Multi-cloud**: using more than one public provider, often to avoid lock-in or to use each provider's strongest service.

## The shared responsibility model

Moving to the cloud does not hand over all of your security. The provider secures the cloud itself; you secure what you put in it. Exactly where the line sits depends on the service model:

1. **IaaS** (virtual machines): the provider handles hardware, network and the hypervisor. You patch the operating system, configure the firewall and secure your app and data.
2. **PaaS** (managed platforms such as Cloud Run or App Engine): the provider also runs the operating system and runtime. You are responsible for your code, configuration and data.
3. **SaaS** (finished apps such as Google Workspace): the provider runs almost everything. You still manage users, passwords, sharing settings and the data you store.

In every model, **your data and who can access it** remain your responsibility.

## Least privilege in practice

Most cloud incidents come from misconfiguration, not from attackers breaking into the provider. Give each person and service only the permissions it needs, for example read-only access to one storage bucket instead of Owner on the whole project:

\`\`\`bash
gcloud storage buckets add-iam-policy-binding gs://course-uploads \\
  --member="user:intern@example.com" \\
  --role="roles/storage.objectViewer"
\`\`\`

Review these permissions regularly and remove access when someone leaves the team or a project ends.

> **Tip:** turn on multi-factor authentication for every cloud console account on day one. A leaked password on an admin account is the fastest way to lose a project.`,
    },
    {
      title: 'Virtual machines vs containers',
      type: 'Video',
      minutes: 9,
      videoId: 'cjXI-yxqGTI',
      videoStart: 0,
      contentMd: `- A VM virtualises hardware and runs a full guest operating system; containers share the host's kernel and package only the app and its dependencies.
- Containers start in seconds and are what platforms like Cloud Run and Kubernetes run. The video also explains why the two often work together.`,
    },
    {
      title: 'Quiz: Cloud basics',
      type: 'Quiz',
      questions: [
        {
          text: 'A company uses Gmail and Google Drive through Google Workspace. Which service model is that?',
          options: ['IaaS', 'PaaS', 'SaaS', 'On-premises'],
          correctIndex: 2,
          explanation: 'Users get finished software in the browser and manage nothing underneath, which is Software as a Service.',
          mono: false,
        },
        {
          text: 'You rent a virtual machine and install operating system updates yourself. Which model is that?',
          options: ['IaaS', 'PaaS', 'SaaS', 'FaaS'],
          correctIndex: 0,
          explanation: 'With Infrastructure as a Service you get raw compute and manage everything from the OS upwards.',
          mono: false,
        },
        {
          text: 'On an IaaS virtual machine, who patches the guest operating system?',
          options: ['The cloud provider', 'You, the customer', 'Nobody, it happens automatically', 'Your internet provider'],
          correctIndex: 1,
          explanation: 'Under the shared responsibility model, the provider secures the hardware and hypervisor; the OS on your VM is your job.',
          mono: false,
        },
        {
          text: 'What is the main difference between containers and virtual machines?',
          options: ['Containers are always slower than VMs', 'VMs cannot run Linux', 'Containers need one hypervisor per app', 'Containers share the host OS kernel, while each VM runs a full guest OS'],
          correctIndex: 3,
          explanation: 'Sharing the kernel makes containers smaller and faster to start than VMs.',
          mono: false,
        },
        {
          text: 'A bank keeps customer records in its own data center and runs its app backend on a public cloud. What is this called?',
          options: ['Multi-cloud', 'Hybrid cloud', 'Private cloud', 'Serverless'],
          correctIndex: 1,
          explanation: 'Hybrid cloud connects on-premises or private infrastructure with a public cloud.',
          mono: false,
        },
      ],
    },
    {
      title: 'Serverless computing',
      type: 'Video',
      minutes: 8,
      videoId: 'vxJobGtqKVM',
      videoStart: 0,
      contentMd: `- With serverless you deploy code or a container; the provider handles servers, scaling and patching.
- You pay for actual use and many services scale to zero when idle. The trade-off is a short *cold start* when a new instance has to boot.`,
    },
    {
      title: 'Regions, availability and cost',
      type: 'Article',
      minutes: 9,
      contentMd: `When you create a cloud resource, you choose where it runs. That choice affects speed for your users, how well the app survives failures, legal rules for data, and the monthly bill.

## Regions and zones

A **region** is a geographic area, such as \`asia-southeast2\` (Jakarta) on Google Cloud or \`ap-southeast-3\` (Jakarta) on AWS. Each region contains several **zones** (availability zones): separate data centers with their own power, cooling and networking.

- Pick a region **close to your users** to lower latency.
- Spread important services across **two or more zones**, so one data center failing does not take you offline.
- Check **data residency rules**. Some data, such as certain government or financial records, may have to stay in the country.

## How you pay

Cloud pricing is pay-as-you-go, but the bill has several parts:

1. **Compute**: per second or hour of VM, container or function time.
2. **Storage**: per GB stored per month.
3. **Network egress**: data sent out to the internet, often the surprise on the bill.
4. **Managed services**: databases, load balancers and so on, each with its own price.

Serverless platforms can scale to zero, so a small project with little traffic can cost almost nothing. A VM costs money every hour it runs, even when nobody uses it.

## Keep costs under control

Forgotten resources are the most common reason students get an unexpected bill. Check for running machines and stop the ones you no longer need:

\`\`\`bash
# list running VMs
gcloud compute instances list --filter="status=RUNNING"

# stop one you forgot
gcloud compute instances stop dev-server --zone=asia-southeast2-a
\`\`\`

Set a **budget alert** in the billing console on day one, label resources by project, and delete test resources as soon as you finish a tutorial. Free tiers and education credits run out faster than you expect.

> **Tip:** use the provider's pricing calculator before you launch something new, and set the budget alert lower than you think you need.`,
    },
    {
      title: 'Deploying an app to Cloud Run',
      type: 'Video',
      minutes: 6,
      videoId: '5aOF-RIZS5c',
      videoStart: 0,
      contentMd: `- \`gcloud run deploy --source .\` builds a container with Cloud Build, stores it in Artifact Registry and deploys it in one step.
- Note the questions it asks: service name, region, and whether to allow unauthenticated invocations. You will script all three in the practice.`,
    },
    {
      title: 'Quiz: Running apps in the cloud',
      type: 'Quiz',
      questions: [
        {
          text: 'What does "serverless" mean?',
          options: ['There are no servers involved at all', 'The provider manages servers and scaling, and you pay per use', 'You buy and install your own servers', 'The app runs only on your laptop'],
          correctIndex: 1,
          explanation: 'Servers still exist, but you never manage them. You deploy code and pay for what actually runs.',
          mono: false,
        },
        {
          text: 'Why run an app in more than one availability zone?',
          options: ['It is required by law', 'It makes the app free', 'The app keeps running if one data center fails', 'It lowers latency for users on every continent'],
          correctIndex: 2,
          explanation: 'Zones are separate data centers in one region, so spreading across them protects against a single failure.',
          mono: false,
        },
        {
          text: 'Which command deploys the current folder to Cloud Run?',
          options: ['git push cloud main', 'docker run --deploy .', 'npm run cloud', 'gcloud run deploy my-app --source .'],
          correctIndex: 3,
          explanation: 'gcloud run deploy with --source builds the container for you and deploys it as a service.',
          mono: true,
        },
        {
          text: 'What is a cold start?',
          options: ['The delay while the platform starts a new instance to handle a request', 'A server that has been switched off', 'A cache miss in the browser', 'A database that has not been backed up'],
          correctIndex: 0,
          explanation: 'When a serverless service has scaled to zero, the first request waits while an instance boots.',
          mono: false,
        },
        {
          text: 'Most of your users are in Indonesia. Which region is the best default?',
          options: ['us-central1, because it is the default', 'asia-southeast2 (Jakarta)', 'The cheapest region on any continent', 'It does not matter for latency'],
          correctIndex: 1,
          explanation: 'A nearby region gives the lowest latency and can help with data residency rules.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Write a deploy script',
      type: 'Practice',
      minutes: 35,
      contentMd: 'Write a script that deploys the Node.js app in this folder to Google Cloud Run. You do not need a real account: write the commands exactly as you would run them in Cloud Shell.',
      practice: {
        fileName: 'deploy.sh',
        language: 'bash',
        starterCode: `#!/usr/bin/env bash
# Deploy the Node.js app in this folder to Google Cloud Run.
set -euo pipefail

PROJECT_ID=""
REGION=""
SERVICE="skilllearn-web"

# 1. Point gcloud at your project

# 2. Deploy from source (Cloud Build creates the container for you)

# 3. Print the public URL of the service
`,
        tasks: [
          'Fill in PROJECT_ID and a REGION close to your users (e.g. asia-southeast2)',
          'Set the active project with gcloud config set project',
          'Deploy with gcloud run deploy from source, in your region, open to the public',
          'Print the service URL with gcloud run services describe',
        ],
        hint: 'A source deploy needs gcloud run deploy SERVICE --source . plus --region and --allow-unauthenticated. For the URL, add --format "value(status.url)" to the describe command.',
        checks: [
          { label: 'Project ID and region are filled in', pattern: 'PROJECT_ID="[a-z][a-z0-9-]{5,29}"[\\s\\S]*REGION="[a-z]+-[a-z]+\\d+"', flags: '' },
          { label: 'Sets the active project', pattern: 'gcloud\\s+config\\s+set\\s+project\\s+\\S+', flags: '' },
          { label: 'Deploys from source to your region', pattern: 'gcloud\\s+run\\s+deploy(?=[\\s\\S]*--source[ =]+\\.)(?=[\\s\\S]*--region)', flags: '' },
          { label: 'Allows public access', pattern: '--allow-unauthenticated', flags: '' },
          { label: 'Prints the service URL', pattern: 'gcloud\\s+run\\s+services\\s+describe[\\s\\S]*status\\.url', flags: '' },
        ],
      },
    },
  ],
};
