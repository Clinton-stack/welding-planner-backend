import { NotFoundException } from "@nestjs/common";
import { FindOptionsWhere, Repository } from "typeorm";

export async function findOneOrThrow <T extends {id: string}>(
    repository: Repository<T>,
    where: FindOptionsWhere<T>,
    entityName: string,
): Promise<T> {
    const entity = await repository.findOne({where});
    if (!entity) {
        throw new NotFoundException(`${entityName} not found`);
    }
    return entity;

}