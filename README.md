# AreoQuiz - AI-Powered Quiz Platform

AreoQuiz is a modern, full-featured quiz platform that leverages AI to generate and manage quizzes for students. Built with Next.js, it supports role-based access (Admin & Student), automatic grading, and comprehensive analytics.

## 🎯 Features

### For Students
- **Take Quizzes**: Participate in daily, weekly, and special quizzes across multiple subjects
- **Multiple Question Types**: Answer both multiple-choice questions (MCQ) and long-form paragraph questions
- **Quiz Timer**: Real-time countdown timer for quiz duration management
- **View Results**: Instant feedback on MCQ answers with detailed result analysis
- **Performance Dashboard**: Track quiz attempts, scores, and performance trends
- **Monthly Analytics**: View performance trends and statistics

### For Admins
- **AI Quiz Generation**: Automatically generate quizzes using OpenAI with customizable parameters
- **Quiz Management**: Create, edit, draft, and publish quizzes
- **Subject Organization**: Organize quizzes by subjects (Science, Social, English, Maths)
- **Quiz Types**: Support for Daily, Weekly, and Special quiz types
- **Manual Grading**: Grade paragraph answers and provide feedback
- **Submission Review**: Review student submissions with tab-switch monitoring
- **Admin Dashboard**: View all quizzes and their statistics

### Platform Features
- **Secure Authentication**: User authentication and role-based access control
- **Real-time Monitoring**: Track tab switches and auto-submit functionality
- **Time Management**: Set availability windows for quizzes
- **MongoDB Integration**: Persistent data storage
- **Responsive Design**: Modern, responsive UI built with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI API
- **Analytics**: Recharts for data visualization
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB instance
- OpenAI API key

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/aeroquiz
GROQ_API_KEY=your_openai_api_key
```

### 3. Seed Initial Data (Optional)

Seed the database with a test admin account:

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   ├── generate/          # AI quiz generation
│   ├── quiz/              # Quiz management
│   ├── stats/             # Analytics endpoints
│   └── submissions/       # Submission handling
├── admin/                 # Admin dashboard pages
├── dashboard/             # Student dashboard pages
├── login/                 # Login page
└── layout.tsx            # Root layout

lib/
├── auth.ts               # NextAuth configuration
├── db.ts                 # MongoDB connection
├── llm.ts                # OpenAI integration
└── models/               # Database schemas
    ├── Quiz.ts
    ├── Submission.ts
    └── User.ts

scripts/
└── seed.ts              # Database seeding script

types/
└── next-auth.d.ts      # Type definitions
```

## 🔐 User Roles

### Admin
- Create and manage quizzes
- Generate quizzes using AI
- Grade paragraph answers
- View all submissions and statistics
- Access: `/admin`

### Student
- Take assigned quizzes
- View results and performance
- Track progress
- Access: `/dashboard`

## 📊 API Endpoints

### Quiz Management
- `POST /api/quiz` - Create a new quiz
- `GET /api/quiz` - Get all quizzes
- `GET /api/quiz/[id]` - Get quiz details
- `GET /api/quiz/[id]/submit` - Submit quiz answers
- `POST /api/quiz/[id]/grade` - Grade submissions

### AI Generation
- `POST /api/generate` - Generate quiz using AI

### Statistics
- `GET /api/stats` - Get student statistics
- `GET /api/submissions/mine` - Get student's submissions
- `GET /api/submissions/[id]` - Get submission details

## 🎮 Usage Examples

### For Students
1. Login with your student credentials
2. Navigate to Dashboard
3. Select an available quiz
4. Answer all questions within the time limit
5. Submit your quiz
6. View results and performance analytics

### For Admins
1. Login with admin credentials
2. Go to Admin Dashboard
3. Create Quiz → Enter quiz details OR use AI Generate
4. Configure quiz parameters (subject, duration, availability)
5. Publish the quiz
6. Grade paragraph answers from Submissions
7. View statistics

## 🧪 Testing

Run linting:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## 📝 Database Models

### User
- Username, Password, Role (admin/student)
- Timestamps

### Quiz
- Title, Subject, Type (daily/weekly/special)
- Questions (MCQ and Paragraph types)
- Availability dates, Duration
- Total marks

### Submission
- Quiz and Student references
- Answers with marks
- Tab-switch tracking
- Status (submitted/graded)
- Timestamps

## 🔄 Common Workflows

### Generate a Quiz with AI
1. Click "Create Quiz" in Admin Dashboard
2. Select "Generate with AI"
3. Enter subject, topic description
4. Specify number of MCQ and paragraph questions
5. Set marks per question type
6. AI generates the quiz automatically

### Grade a Submission
1. Go to Admin → Grade
2. Select submission to review
3. For each paragraph answer, enter marks and comments
4. Submit grades
5. Marks are calculated and results become visible to student

## 📱 Features in Development

- Advanced analytics and detailed performance insights
- Batch quiz scheduling
- Question bank management
- Export results to CSV/PDF
- Student groups and class management

## 🐛 Troubleshooting

### Quiz not showing for student
- Check availability dates
- Ensure student is logged in
- Verify quiz is published

### Can't generate AI quiz
- Check OpenAI API key is valid
- Verify API account has sufficient credits
- Check API rate limits

### Authentication issues
- Ensure `.env.local` is properly configured
- Clear browser cookies
- Restart development server

## 📄 License

This project is for internal use only.

## 📞 Support

For issues or questions, please contact the development team.
