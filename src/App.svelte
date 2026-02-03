<script lang="ts">
  import { Edit, Plus, Search, Trash2 } from "lucide-svelte";
  import { onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import RuleModal from "./lib/components/RuleModal.svelte";
  import type { Rule } from "./lib/types";

  let rules: Rule[] = [];
  let isModalOpen = false;
  let editingRule: Rule | null = null;
  let searchQuery = "";

  // Load rules on mount
  onMount(async () => {
    // Check if browser extension API exists (dev mode fallback)
    if (typeof browser !== "undefined" && browser.storage) {
      const stored = await browser.storage.sync.get("rules");
      rules = stored.rules || [];
    } else {
      // Mock data for local development
      rules = [
        {
          id: "1",
          name: "Google Dev",
          enabled: true,
          matchType: "contains",
          pattern: "google.com",
          sourceType: "preset",
          value: "shield.png",
        },
      ];
    }
  });

  async function saveRules() {
    rules = rules; // trigger update
    if (typeof browser !== "undefined" && browser.storage) {
      await browser.storage.sync.set({ rules });
    }
  }

  function openNewRule() {
    editingRule = {
      id: uuidv4(),
      name: "",
      enabled: true,
      matchType: "contains",
      pattern: "",
      sourceType: "preset",
      value: "shield.png",
    };
    isModalOpen = true;
  }

  function editRule(rule: Rule) {
    editingRule = { ...rule }; // clone
    isModalOpen = true;
  }

  function handleSave(event: CustomEvent<Rule>) {
    const newRule = event.detail;
    const index = rules.findIndex((r) => r.id === newRule.id);
    if (index >= 0) {
      rules[index] = newRule;
    } else {
      rules = [...rules, newRule];
    }
    saveRules();
  }

  function deleteRule(id: string) {
    rules = rules.filter((r) => r.id !== id);
    saveRules();
  }

  function toggleRule(rule: Rule) {
    rule.enabled = !rule.enabled;
    saveRules();
  }

  $: filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pattern.toLowerCase().includes(searchQuery.toLowerCase()),
  );
</script>

<main class="baseDepth min-h-screen p-8 text-slate-200">
  <div class="mx-auto max-w-5xl">
    <!-- Header -->
    <header class="mb-10 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">Favicon Master</h1>
        <p class="text-slate-400">Manage your custom browser identities</p>
      </div>
      <button
        on:click={openNewRule}
        class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
      >
        <Plus size={18} /> Add Rule
      </button>
    </header>

    <!-- Search / Filter Bar -->
    <div
      class="mb-6 flex items-center rounded-xl border border-border bg-surface px-4 py-3"
    >
      <Search size={20} class="text-slate-400" />
      <input
        bind:value={searchQuery}
        type="text"
        placeholder="Search rules..."
        class="ml-3 w-full bg-transparent text-sm focus:outline-none"
      />
    </div>

    <!-- Rules Table -->
    <div class="overflow-hidden rounded-xl border border-border bg-surface">
      <table class="w-full text-left">
        <thead class="bg-slate-900/50 text-xs uppercase text-slate-400">
          <tr>
            <th class="px-6 py-4">Enabled</th>
            <th class="px-6 py-4">Preview</th>
            <th class="px-6 py-4">Name</th>
            <th class="px-6 py-4">Match Pattern</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each filteredRules as rule (rule.id)}
            <tr class="group hover:bg-slate-700/30 transition-colors">
              <td class="px-6 py-4">
                <button
                  on:click={() => toggleRule(rule)}
                  class="relative h-6 w-11 rounded-full transition-colors {rule.enabled
                    ? 'bg-primary'
                    : 'bg-slate-600'}"
                >
                  <span
                    class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform {rule.enabled
                      ? 'translate-x-5'
                      : 'translate-x-0'}"
                  />
                </button>
              </td>
              <td class="px-6 py-4">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded bg-white p-1"
                >
                  {#if rule.sourceType === "preset"}
                    <img
                      src="/presets/{rule.value}"
                      alt=""
                      class="max-h-full max-w-full"
                    />
                  {:else}
                    <img
                      src={rule.value}
                      alt=""
                      class="max-h-full max-w-full"
                    />
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 font-medium text-white">{rule.name}</td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm text-slate-200">{rule.pattern}</span>
                  <span class="text-xs text-slate-500 uppercase"
                    >{rule.matchType}</span
                  >
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div
                  class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    on:click={() => editRule(rule)}
                    class="rounded p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    on:click={() => deleteRule(rule.id)}
                    class="rounded p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if filteredRules.length === 0}
        <div class="p-8 text-center text-slate-500">
          No rules found. Create one to get started!
        </div>
      {/if}
    </div>
  </div>

  {#if editingRule}
    <RuleModal
      bind:isOpen={isModalOpen}
      bind:rule={editingRule}
      on:save={handleSave}
    />
  {/if}
</main>

<style>
  :global(body) {
    background-color: #0f172a; /* Tailwind bg-slate-900 */
  }
</style>
