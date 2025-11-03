<h3 align="center">AORA</h3>

   <div align="center">
     This Repository is a Full Stack Video sharing social app built using React Native, Expo, Appwrite, and Tailwind CSS.
   </div>
</div>

## <a name="tech-stack">⚙️ Tech Stack</a>

- React Native
- Expo
- Appwrite
- Tailwind CSS

## <a name="features">🔋 Features</a>

👉 **Email and Password Authentication**: Secure login with email and password.

👉 **Home Screen**: Display trending and latest contents.

👉 **Content Creation Screen**: Create content to display.

👉 **Content Search Screen**: Simple search for contents.

👉 **User Profile Screen**: User profile details.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/sir-radar/rn-aora.git
cd rn-aora
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env

EXPO_PUBLIC_APPWRITE_PROJECT_ID=
EXPO_PUBLIC_APPWRITE_ENDPOINT=
EXPO_PUBLIC_APPWRITE_DATABASE_ID=
EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID=
EXPO_PUBLIC_APPWRITE_VIDEOS_TABLE_ID=
EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=


```

Replace the placeholder values with your actual Appwrite credentials. You can
obtain these credentials by signing up on
the [Appwrite](https://appwrite.io/) website.

**Running the Project**

```bash
npx expo start
```

Download the [Expo Go](https://expo.dev/go) app and Scan the QR code on your respective device to view the project.
