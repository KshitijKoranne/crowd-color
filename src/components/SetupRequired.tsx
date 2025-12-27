import { isSupabaseConfigured } from '../lib/supabase';

export default function SetupRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-8">
      <div className="max-w-2xl bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supabase Setup Required
          </h1>
          <p className="text-gray-600">
            CrowdColor needs a Supabase backend to function
          </p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-yellow-900 mb-2">
            ❌ Missing Environment Variables
          </h2>
          <p className="text-sm text-yellow-800">
            The following environment variables are not configured:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-800 mt-2">
            <li><code className="bg-yellow-100 px-2 py-1 rounded">VITE_SUPABASE_URL</code></li>
            <li><code className="bg-yellow-100 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              📋 Quick Setup (5 minutes)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Create a free Supabase account at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  supabase.com
                </a>
              </li>
              <li>Create a new project</li>
              <li>
                Follow the detailed setup guide in{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  SUPABASE_SETUP.md
                </code>
              </li>
              <li>
                Create a <code className="bg-gray-100 px-2 py-1 rounded text-xs">.env</code> file
                in the project root
              </li>
              <li>Add your Supabase credentials to the <code className="bg-gray-100 px-2 py-1 rounded text-xs">.env</code> file</li>
              <li>Restart the dev server</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Your .env file should look like this:
            </h4>
            <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Check the{' '}
              <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                QUICKSTART.md
              </code>{' '}
              file for step-by-step instructions with screenshots.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            After setting up Supabase and adding your credentials, refresh this page
          </p>
        </div>
      </div>
    </div>
  );
}

// Export a component that checks if Supabase is configured
export function withSupabaseCheck(Component: React.ComponentType) {
  return function WrappedComponent(props: any) {
    if (!isSupabaseConfigured) {
      return <SetupRequired />;
    }
    return <Component {...props} />;
  };
}
