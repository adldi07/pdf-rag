import {FileUpload} from './components/file-upload';


export default function Home() {
  return (
    <div>
      <div className="min-h-screen w-screen flex">
        <div className="w-[30vw] min-h-screen flex items-center justify-center">
          <FileUpload/>
        </div>
        <div className="w-[70vw] min-h-screen border-l-2">
          hi2 
        </div>
      </div>
    </div>
  );
}
