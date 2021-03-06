import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("environments", (table) => {
    table.boolean("working").notNullable().defaultTo(false).index();
  });
}

export async function down(knex: Knex): Promise<void> {}
