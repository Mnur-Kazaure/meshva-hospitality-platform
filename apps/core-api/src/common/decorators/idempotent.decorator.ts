import { SetMetadata } from '@nestjs/common';
import { IDEMPOTENT_OPERATION_KEY } from '../constants';

export const IdempotentOperation = () => SetMetadata(IDEMPOTENT_OPERATION_KEY, true);
