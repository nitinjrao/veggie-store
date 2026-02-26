import path from 'path';

// Use vi.hoisted so these variables are available inside the hoisted vi.mock factory
const captured = vi.hoisted(() => ({
  storage: null as {
    destination: string;
    filename: (
      req: unknown,
      file: { originalname: string },
      cb: (err: Error | null, result: string) => void
    ) => void;
  } | null,
  fileFilter: null as
    | ((
        req: unknown,
        file: { originalname: string },
        cb: (err: Error | null, accept?: boolean) => void
      ) => void)
    | null,
  limits: null as { fileSize: number } | null,
}));

vi.mock('multer', () => {
  const diskStorageMock = vi.fn((config: NonNullable<typeof captured.storage>) => {
    captured.storage = config;
    return config;
  });

  const multerMock = vi.fn(
    (config: {
      storage: unknown;
      fileFilter: NonNullable<typeof captured.fileFilter>;
      limits: NonNullable<typeof captured.limits>;
    }) => {
      captured.fileFilter = config.fileFilter;
      captured.limits = config.limits;
      return { single: vi.fn(), array: vi.fn() };
    }
  );

  (multerMock as Record<string, unknown>).diskStorage = diskStorageMock;

  return { default: multerMock };
});

// Import after mocking to trigger the multer configuration
import './upload';

describe('upload middleware', () => {
  describe('storage configuration', () => {
    it('sets destination to uploads directory', () => {
      expect(captured.storage!.destination).toBe(path.join(__dirname, '../../uploads'));
    });

    it('generates unique filename with correct extension', () => {
      const file = { originalname: 'photo.JPG' };
      const cb = vi.fn();

      captured.storage!.filename({}, file, cb);

      expect(cb).toHaveBeenCalledTimes(1);
      const [err, filename] = cb.mock.calls[0];
      expect(err).toBeNull();
      expect(filename).toMatch(/^[a-z0-9]+\.jpg$/);
    });

    it('preserves lowercase extension', () => {
      const file = { originalname: 'image.png' };
      const cb = vi.fn();

      captured.storage!.filename({}, file, cb);

      const [, filename] = cb.mock.calls[0];
      expect(filename).toMatch(/\.png$/);
    });
  });

  describe('fileFilter', () => {
    it('accepts .jpg files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'photo.jpg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .jpeg files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'photo.jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .png files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'image.png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .webp files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'image.webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .gif files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'animation.gif' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts uppercase extensions', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'photo.PNG' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('rejects .pdf files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'document.pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('rejects .txt files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'readme.txt' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('rejects .svg files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'icon.svg' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('provides correct error message for rejected files', () => {
      const cb = vi.fn();
      captured.fileFilter!({}, { originalname: 'file.bmp' }, cb);
      const error = cb.mock.calls[0][0] as Error;
      expect(error.message).toBe('Only image files (jpg, png, webp, gif) are allowed');
    });
  });

  describe('limits', () => {
    it('sets file size limit to 5MB', () => {
      expect(captured.limits!.fileSize).toBe(5 * 1024 * 1024);
    });
  });
});
