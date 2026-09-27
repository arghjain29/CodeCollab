import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Quality is set per render instead: the GIF codec rejects a CRF, so it can't live here.
