<!-- src/App.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import RuleModal from "./lib/components/RuleModal.svelte";
  import type { Rule } from "./lib/types";
  import { storage } from "./lib/storage"; // Import the new storage
  import { Trash2, Edit2, Plus, Search, Loader2 } from "lucide-svelte";

  let rules: Rule[] = [];
  let isModalOpen = false;
  let editingRule: Rule | null = null;
  let searchQuery = "";
  let loading = true;

  onMount(async () => {
    rules = await storage.getRules();
    loading = false;
  });

  async function saveRules() {
    rules = [...rules];
    await storage.saveRules(rules);
  }

  function openNewRule() {
    editingRule = {
      id: uuidv4(),
      name: "",
      enabled: true,
      matchType: "contains",
      pattern: "",
      sourceType: "preset",
      value: "book.png",
    };
    isModalOpen = true;
  }

  function editRule(rule: Rule) {
    editingRule = { ...rule };
    isModalOpen = true;
  }

  function handleSave(event: CustomEvent<Rule>) {
    const newRule = event.detail;
    const index = rules.findIndex((r) => r.id === newRule.id);

    if (index >= 0) {
      rules[index] = newRule;
    } else {
      rules.push(newRule);
    }
    saveRules();
    isModalOpen = false;
  }

  function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
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

<main>
  <header>
    <div class="title-group">
      <h1>Favifox</h1>
      <p>Custom Favicon Manager</p>
    </div>
    <button class="btn-primary" on:click={openNewRule} disabled={loading}>
      <Plus size={16} /> New Rule
    </button>
  </header>

  {#if loading}
    <div class="loading-state">
      <Loader2 size={32} class="spin" />
      <p>Loading configuration...</p>
    </div>
  {:else}
    <div class="toolbar">
      <div class="search-bar">
        <Search size={16} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search rules..."
          bind:value={searchQuery}
        />
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 60px;">On/Off</th>
            <th style="width: 60px;">Icon</th>
            <th>Name</th>
            <th>Pattern</th>
            <th style="width: 100px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredRules as rule (rule.id)}
            <tr>
              <td>
                <label class="switch">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    on:change={() => toggleRule(rule)}
                  />
                  <span class="slider"></span>
                </label>
              </td>
              <td>
                <div class="icon-preview">
                  {#if rule.sourceType === "preset"}
                    <img src="/presets/{rule.value}" alt="icon" />
                  {:else}
                    <img
                      src={rule.value}
                      alt="icon"
                      on:error={(e) => (e.currentTarget.src = "/vite.svg")}
                    />
                  {/if}
                </div>
              </td>
              <td><strong>{rule.name}</strong></td>
              <td class="pattern-cell">
                <code>{rule.pattern}</code>
                <span class="badge">{rule.matchType}</span>
              </td>
              <td style="text-align: right;">
                <button
                  class="btn-icon"
                  on:click={() => editRule(rule)}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  class="btn-icon danger"
                  on:click={() => deleteRule(rule.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filteredRules.length === 0}
        <div class="empty-state">
          {searchQuery
            ? "No matching rules found."
            : "No rules configured. Add one to get started."}
        </div>
      {/if}
    </div>
  {/if}

  {#if isModalOpen && editingRule}
    <RuleModal
      rule={editingRule}
      on:save={handleSave}
      on:close={() => (isModalOpen = false)}
    />
  {/if}
</main>

<style>
  /* Use the exact same CSS as provided in the previous step */
  /* Add this specific animation for loading */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    color: var(--text-secondary);
    gap: 16px;
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* ... Include previous styles ... */
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .title-group h1 {
    font-size: 24px;
    font-weight: 600;
  }
  .title-group p {
    color: var(--text-secondary);
    font-size: 14px;
  }
  .toolbar {
    margin-bottom: 16px;
  }
  .search-bar {
    display: flex;
    align-items: center;
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    border-radius: var(--radius);
    gap: 8px;
  }
  .search-bar input {
    background: transparent;
    border: none;
    color: white;
    width: 100%;
    outline: none;
  }
  .table-container {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  th {
    background: rgba(0, 0, 0, 0.2);
    font-size: 12px;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: 600;
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  .icon-preview {
    width: 32px;
    height: 32px;
    background: #fff;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
  }
  .icon-preview img {
    max-width: 100%;
    max-height: 100%;
  }
  .pattern-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pattern-cell code {
    font-family: monospace;
    color: var(--text-secondary);
  }
  .badge {
    display: inline-block;
    font-size: 10px;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-secondary);
    width: fit-content;
  }
  .empty-state {
    padding: 32px;
    text-align: center;
    color: var(--text-secondary);
  }
  .btn-primary {
    background: var(--accent-color);
    color: white;
    padding: 8px 16px;
    border-radius: var(--radius);
    font-weight: 500;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .btn-primary:hover {
    background: var(--accent-hover);
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-icon {
    background: transparent;
    color: var(--text-secondary);
    padding: 6px;
    border-radius: 4px;
  }
  .btn-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  .btn-icon.danger:hover {
    background: var(--danger-color);
    color: white;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #4a4a55;
    border-radius: 20px;
    transition: 0.2s;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: 0.2s;
  }
  input:checked + .slider {
    background-color: var(--success-color);
  }
  input:checked + .slider:before {
    transform: translateX(20px);
  }
</style>
