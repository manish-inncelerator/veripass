import {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'VeriPass',
  description: 'Verify Passport App',
};

const HomePage = async () => {
  return (
    <div>
      <h1>VeriPass</h1>
      <p>API for passport extraction and validation. Use /api endpoint.</p>
    </div>
  );
};

export default HomePage;
