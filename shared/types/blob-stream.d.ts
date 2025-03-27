declare module 'blob-stream' {
  interface BlobStream {
    on(event: string, callback: (...args: any[]) => void): void;
    pipe(destination: any): any;
    toBlob(): Blob;
    toBuffer(): Buffer;
  }
  
  export default function(): BlobStream;
}