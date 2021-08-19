import { deleteUndefined, Hash, t } from '../common';
import { ManifestFileHash } from './ManifestFile.Hash';
import { ManifestFileImage } from './ManifestFile.Image';

export const ManifestFile = {
  Hash: ManifestFileHash,
  Image: ManifestFileImage,

  /**
   * Load a file and prepare it for inclusion within a manifest.
   */
  async parse(args: { fs: t.INodeFs; baseDir: string; path: string }): Promise<t.ManifestFile> {
    const { fs } = args;

    // File.
    const file = await fs.readFile(args.path);
    const bytes = file.byteLength;
    const filehash = Hash.sha256(file);
    const path = args.path.substring(args.baseDir.length + 1);

    // Image (NB: Will return [undefined] if not an image-type).
    const image = await ManifestFileImage.parse(fs, args.path);

    // Finish up.
    const res: t.ManifestFile = { path, filehash, bytes, image };
    return deleteUndefined(res);
  },
};
