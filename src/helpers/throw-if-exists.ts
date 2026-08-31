import { ConflictException } from '@nestjs/common';
import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

export async function throwIfExists<T extends ObjectLiteral>(
  repository: Repository<T>,
  where: FindOptionsWhere<T>,
  entityName: string,
): Promise<void> {
  const entity = await repository.findOne({ where });

  if (entity) {
    throw new ConflictException(`${entityName} already exists`);
  }
}
