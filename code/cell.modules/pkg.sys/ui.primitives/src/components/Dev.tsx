import React from 'react';
import { Harness } from 'sys.ui.dev';

import useDragTarget from '../hooks/useDragTarget/useDragTarget.DEV';

export const ACTIONS = [useDragTarget];
export const Dev: React.FC = () => <Harness actions={ACTIONS} />;
